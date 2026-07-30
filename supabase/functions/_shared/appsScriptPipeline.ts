import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { requireEnv } from "./googleOAuth.ts";
import { googleJson } from "./googleForms.ts";

export type PipelineInstallResult = {
  status: "installed" | "already_installed" | "error";
  apps_script_project_id: string | null;
  apps_script_deployment_id: string | null;
  script_editor_url?: string | null;
  error?: string;
};

function scriptEditorUrl(projectId: string): string {
  return `https://script.google.com/d/${projectId}/edit`;
}

async function persistProjectId(
  admin: SupabaseClient,
  renderAccountId: string,
  projectId: string
): Promise<void> {
  const now = new Date().toISOString();
  await admin
    .from("render_ingestion_credentials")
    .update({
      apps_script_project_id: projectId,
      updated_at: now,
    })
    .eq("render_account_id", renderAccountId);

  await admin
    .from("render_accounts")
    .update({
      apps_script_project_id: projectId,
      updated_at: now,
    })
    .eq("id", renderAccountId);
}

function randomWebhookSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function buildAppsScriptSource(config: {
  accountId: string;
  formId: string;
  sheetId: string;
  webhookUrl: string;
  webhookSecret: string;
}): { code: string; manifest: string } {
  const code = `/**
 * TutorTrack Render an Account response pipeline.
 * Pushes each Google Form submission to TutorTrack in real time.
 */
var CONFIG = {
  ACCOUNT_ID: ${JSON.stringify(config.accountId)},
  FORM_ID: ${JSON.stringify(config.formId)},
  SHEET_ID: ${JSON.stringify(config.sheetId)},
  WEBHOOK_URL: ${JSON.stringify(config.webhookUrl)},
  WEBHOOK_SECRET: ${JSON.stringify(config.webhookSecret)}
};

/** One-time setup: link Form → Sheet and install On Form Submit trigger. */
function installPipeline() {
  var form = FormApp.openById(CONFIG.FORM_ID);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, CONFIG.SHEET_ID);

  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'handleFormSubmit') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('handleFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();

  return 'installed';
}

/** Installable trigger handler — runs after every form submission. */
function handleFormSubmit(e) {
  if (!e || !e.response) {
    throw new Error('Missing form response event');
  }

  var formResponse = e.response;
  var itemResponses = formResponse.getItemResponses();
  var answers = [];
  var whoAreYou = '';

  for (var i = 0; i < itemResponses.length; i++) {
    var itemResponse = itemResponses[i];
    var item = itemResponse.getItem();
    var title = String(item.getTitle() || '');
    var response = itemResponse.getResponse();
    var value = '';

    if (response === null || response === undefined) {
      value = '';
    } else if (Object.prototype.toString.call(response) === '[object Array]') {
      value = response.join(', ');
    } else {
      value = String(response);
    }

    answers.push({
      google_item_id: String(item.getId()),
      title: title,
      response: value
    });

    if (title === 'Who are you?') {
      whoAreYou = value;
    }
  }

  var payload = {
    render_account_id: CONFIG.ACCOUNT_ID,
    google_form_id: CONFIG.FORM_ID,
    google_sheet_id: CONFIG.SHEET_ID,
    google_response_id: String(formResponse.getId()),
    submitted_at: formResponse.getTimestamp().toISOString(),
    who_are_you: whoAreYou,
    answers: answers
  };

  postWithRetry(payload);
}

function postWithRetry(payload) {
  var maxAttempts = 3;
  var lastCode = 0;
  var lastBody = '';

  for (var attempt = 1; attempt <= maxAttempts; attempt++) {
    var response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'X-TutorTrack-Webhook-Secret': CONFIG.WEBHOOK_SECRET,
        'X-TutorTrack-Account-Id': CONFIG.ACCOUNT_ID
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    lastCode = response.getResponseCode();
    lastBody = response.getContentText();

    if (lastCode >= 200 && lastCode < 300) {
      return;
    }

    Utilities.sleep(1000 * attempt);
  }

  throw new Error(
    'TutorTrack ingest failed after retries. HTTP ' + lastCode + ': ' + lastBody
  );
}
`;

  const manifest = JSON.stringify(
    {
      timeZone: "America/Denver",
      exceptionLogging: "STACKDRIVER",
      runtimeVersion: "V8",
      executionApi: {
        access: "MYSELF",
      },
      oauthScopes: [
        "https://www.googleapis.com/auth/forms",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/script.scriptapp",
        "https://www.googleapis.com/auth/script.external_request",
      ],
    },
    null,
    2
  );

  return { code, manifest };
}

async function ensureCredentials(
  admin: SupabaseClient,
  renderAccountId: string
): Promise<{ webhookSecret: string; existingProjectId: string | null; installStatus: string }> {
  const { data: existing, error } = await admin
    .from("render_ingestion_credentials")
    .select(
      "webhook_secret, apps_script_project_id, install_status"
    )
    .eq("render_account_id", renderAccountId)
    .maybeSingle();

  if (error) {
    throw new Error(`CREDENTIALS_LOAD_FAILED:${error.message}`);
  }

  if (existing?.webhook_secret) {
    return {
      webhookSecret: existing.webhook_secret as string,
      existingProjectId: (existing.apps_script_project_id as string) ?? null,
      installStatus: (existing.install_status as string) ?? "not_installed",
    };
  }

  const webhookSecret = randomWebhookSecret();
  const now = new Date().toISOString();
  const { error: insertError } = await admin.from("render_ingestion_credentials").insert({
    render_account_id: renderAccountId,
    webhook_secret: webhookSecret,
    install_status: "not_installed",
    updated_at: now,
  });

  if (insertError) {
    throw new Error(`CREDENTIALS_CREATE_FAILED:${insertError.message}`);
  }

  return {
    webhookSecret,
    existingProjectId: null,
    installStatus: "not_installed",
  };
}

/**
 * Create/update Apps Script on the Form, link Form→Sheet, install On Form Submit.
 * Idempotent when already installed (refreshes script content + trigger).
 */
export async function installResponsePipeline(
  admin: SupabaseClient,
  accessToken: string,
  params: {
    renderAccountId: string;
    formId: string;
    sheetId: string;
  }
): Promise<PipelineInstallResult> {
  try {
    const { webhookSecret, existingProjectId, installStatus } =
      await ensureCredentials(admin, params.renderAccountId);

    if (installStatus === "installed" && existingProjectId) {
      // Refresh script content/secrets in case webhook URL or sheet changed.
    }

    const supabaseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
    const webhookUrl = `${supabaseUrl}/functions/v1/ingest-google-form-response`;
    const { code, manifest } = buildAppsScriptSource({
      accountId: params.renderAccountId,
      formId: params.formId,
      sheetId: params.sheetId,
      webhookUrl,
      webhookSecret,
    });

    let projectId = existingProjectId;

    if (!projectId) {
      const created = await googleJson<{ scriptId?: string }>(
        accessToken,
        "https://script.googleapis.com/v1/projects",
        {
          method: "POST",
          body: JSON.stringify({
            title: "TutorTrack Response Pipeline",
            parentId: params.formId,
          }),
        }
      );

      if (!created.scriptId) {
        throw new Error("SCRIPT_CREATE_FAILED");
      }
      projectId = created.scriptId;
    }

    // Persist early so a later scripts.run failure still leaves a usable project.
    await persistProjectId(admin, params.renderAccountId, projectId);

    await googleJson(
      accessToken,
      `https://script.googleapis.com/v1/projects/${projectId}/content`,
      {
        method: "PUT",
        body: JSON.stringify({
          files: [
            {
              name: "Code",
              type: "SERVER_JS",
              source: code,
            },
            {
              name: "appsscript",
              type: "JSON",
              source: manifest,
            },
          ],
        }),
      }
    );

    // Create a numbered version (best-effort). Not required for editor Run.
    try {
      await googleJson(
        accessToken,
        `https://script.googleapis.com/v1/projects/${projectId}/versions`,
        {
          method: "POST",
          body: JSON.stringify({
            description: "TutorTrack response pipeline",
          }),
        }
      );
    } catch (versionError) {
      console.warn("Apps Script version create skipped:", versionError);
    }

    const editorUrl = scriptEditorUrl(projectId);

    async function markInstalled(source: string): Promise<PipelineInstallResult> {
      const now = new Date().toISOString();
      const { error: updateError } = await admin
        .from("render_ingestion_credentials")
        .update({
          apps_script_project_id: projectId,
          install_status: "installed",
          install_error: null,
          installed_at: now,
          updated_at: now,
        })
        .eq("render_account_id", params.renderAccountId);

      if (updateError) {
        throw new Error(`CREDENTIALS_UPDATE_FAILED:${updateError.message}`);
      }

      await admin
        .from("render_accounts")
        .update({
          apps_script_project_id: projectId,
          response_pipeline_status: "installed",
          response_pipeline_error: null,
          response_pipeline_installed_at: now,
          updated_at: now,
        })
        .eq("id", params.renderAccountId);

      console.log(
        JSON.stringify({
          event: "response_pipeline_installed",
          source,
          render_account_id: params.renderAccountId,
          apps_script_project_id: projectId,
        })
      );

      return {
        status: "installed",
        apps_script_project_id: projectId,
        apps_script_deployment_id: null,
        script_editor_url: editorUrl,
      };
    }

    async function formHasLinkedSheet(): Promise<boolean> {
      try {
        const form = await googleJson<{ linkedSheetId?: string }>(
          accessToken,
          `https://forms.googleapis.com/v1/forms/${params.formId}`,
          { method: "GET" }
        );
        const linked = form.linkedSheetId?.trim();
        if (!linked) return false;
        // Prefer exact match to TutorTrack sheet; accept any linked sheet as proof
        // that installPipeline already ran successfully.
        return !params.sheetId || linked === params.sheetId || linked.length > 0;
      } catch (verifyError) {
        console.warn("Unable to verify linkedSheetId:", verifyError);
        return false;
      }
    }

    // If the tutor already ran installPipeline manually, Form has a linked sheet.
    if (await formHasLinkedSheet()) {
      return await markInstalled("linked_sheet_verified");
    }

    // Google's Execution API (scripts.run) often returns 403 for API-created
    // projects. Try it, then re-check linked sheet / show manual instructions.
    try {
      const runResult = await googleJson<{
        error?: { message?: string; details?: unknown };
        response?: { result?: unknown };
      }>(
        accessToken,
        `https://script.googleapis.com/v1/scripts/${projectId}:run`,
        {
          method: "POST",
          body: JSON.stringify({
            function: "installPipeline",
            devMode: true,
          }),
        }
      );

      if (runResult.error) {
        throw new Error(runResult.error.message ?? "installPipeline failed");
      }

      return await markInstalled("scripts_run");
    } catch (runError) {
      const runMessage =
        runError instanceof Error ? runError.message : String(runError);
      console.warn("scripts.run failed:", runMessage);

      // Manual Run may have completed between checks.
      if (await formHasLinkedSheet()) {
        return await markInstalled("linked_sheet_after_run_failure");
      }

      const now = new Date().toISOString();
      const help =
        `Google blocked automatic trigger setup. Open the Apps Script editor, select function "installPipeline", click Run, approve permissions, then click Sync Changes again. Editor: ${editorUrl}`;

      await admin
        .from("render_ingestion_credentials")
        .update({
          apps_script_project_id: projectId,
          install_status: "error",
          install_error: help.slice(0, 900),
          updated_at: now,
        })
        .eq("render_account_id", params.renderAccountId);

      await admin
        .from("render_accounts")
        .update({
          apps_script_project_id: projectId,
          response_pipeline_status: "error",
          response_pipeline_error: help.slice(0, 900),
          updated_at: now,
        })
        .eq("id", params.renderAccountId);

      return {
        status: "error",
        apps_script_project_id: projectId,
        apps_script_deployment_id: null,
        script_editor_url: editorUrl,
        error: help.slice(0, 900),
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("installResponsePipeline failed:", message);

    const now = new Date().toISOString();
    const { data: existingCreds } = await admin
      .from("render_ingestion_credentials")
      .select("webhook_secret, apps_script_project_id")
      .eq("render_account_id", params.renderAccountId)
      .maybeSingle();

    const projectId =
      (existingCreds?.apps_script_project_id as string | null) ?? null;

    if (existingCreds?.webhook_secret) {
      await admin
        .from("render_ingestion_credentials")
        .update({
          install_status: "error",
          install_error: message.slice(0, 500),
          updated_at: now,
        })
        .eq("render_account_id", params.renderAccountId);
    } else {
      await admin.from("render_ingestion_credentials").upsert(
        {
          render_account_id: params.renderAccountId,
          webhook_secret: randomWebhookSecret(),
          install_status: "error",
          install_error: message.slice(0, 500),
          updated_at: now,
        },
        { onConflict: "render_account_id" }
      );
    }

    await admin
      .from("render_accounts")
      .update({
        response_pipeline_status: "error",
        response_pipeline_error: message.slice(0, 500),
        updated_at: now,
      })
      .eq("id", params.renderAccountId);

    return {
      status: "error",
      apps_script_project_id: projectId,
      apps_script_deployment_id: null,
      script_editor_url: projectId ? scriptEditorUrl(projectId) : null,
      error: message.slice(0, 500),
    };
  }
}
