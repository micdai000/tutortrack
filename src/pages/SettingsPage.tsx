import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "../components/AuthProvider";
import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "../components/layout";
import { Button, Field, Input } from "../components/ui";
import { getDisplayFirstName } from "../utils/greeting";
import { getErrorMessage } from "../utils/getErrorMessage";
import "../styles/settings.css";

function SettingsPage() {
  const { user, updateProfileName } = useAuth();
  const [name, setName] = useState(() => getDisplayFirstName(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(getDisplayFirstName(user));
  }, [user]);

  const currentName = getDisplayFirstName(user);
  const trimmedName = name.trim();
  const hasChanges = trimmedName !== currentName.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    if (!hasChanges) return;

    setSaving(true);

    try {
      await updateProfileName(trimmedName);
      setSuccessMessage("Profile saved.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save your profile."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer className="settings-page">
      <PageHeader
        title="Settings"
        description="Manage your TutorTrack profile."
      />

      <SectionCard
        title="Edit profile"
        description="This name appears in your dashboard greeting and sidebar."
      >
        <form
          className="settings-form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <Field label="Name" htmlFor="profile-name" error={error}>
            <Input
              id="profile-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
                if (successMessage) setSuccessMessage(null);
              }}
              autoComplete="name"
              required
              maxLength={80}
              disabled={saving}
              aria-invalid={error ? true : undefined}
            />
          </Field>

          {user?.email && (
            <p className="settings-email">Signed in as {user.email}</p>
          )}

          {successMessage && (
            <p className="settings-success" role="status">
              {successMessage}
            </p>
          )}

          <div className="settings-actions">
            <Button
              type="submit"
              disabled={saving || !trimmedName || !hasChanges}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </SectionCard>
    </PageContainer>
  );
}

export default SettingsPage;
