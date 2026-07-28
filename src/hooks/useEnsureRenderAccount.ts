import { useEffect, useRef, useState } from "react";

import {
  createRenderAccount,
  getRenderAccount,
} from "../services/renderAccountService";
import type { RenderAccount } from "../types/renderAccount";
import { getErrorMessage } from "../utils/getErrorMessage";

const DEFAULT_ACCOUNT_TITLE = "Render an Account";

type UseEnsureRenderAccountResult = {
  account: RenderAccount | null;
  loading: boolean;
  error: string | null;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
};

/**
 * Loads the tutor's Render an Account and creates one automatically if missing.
 * Every tutor always has exactly one account after loading completes.
 */
export function useEnsureRenderAccount(): UseEnsureRenderAccountResult {
  const [account, setAccount] = useState<RenderAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ensureStarted = useRef(false);

  async function refresh(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    ensureStarted.current = false;

    try {
      const existing = await getRenderAccount();

      if (existing) {
        setAccount(existing);
        return;
      }

      if (ensureStarted.current) {
        return;
      }

      ensureStarted.current = true;

      try {
        const created = await createRenderAccount(DEFAULT_ACCOUNT_TITLE);
        setAccount(created);
      } catch (createErr) {
        // Concurrent create (unique on user_id) — load the winner.
        const message = getErrorMessage(createErr, "");
        if (
          message.includes("already have a Render an Account") ||
          (createErr instanceof Error && message.includes("23505"))
        ) {
          const raced = await getRenderAccount();
          if (raced) {
            setAccount(raced);
            return;
          }
        }
        throw createErr;
      }
    } catch (err) {
      setAccount(null);
      setError(getErrorMessage(err, "Unable to load Render an Account."));
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return {
    account,
    loading,
    error,
    refresh,
  };
}
