import { useEffect, useState } from "react";

import {
  createRenderAccount,
  getRenderAccount,
  updateRenderAccount,
} from "../services/renderAccountService";
import type { RenderAccount } from "../types/renderAccount";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseRenderAccountResult = {
  account: RenderAccount | null;
  loading: boolean;
  error: string | null;
  create: (title: string) => Promise<void>;
  update: (title: string) => Promise<void>;
  refresh: () => Promise<void>;
};

/** Loads and mutates the current tutor's Render an Account (at most one). */
export function useRenderAccount(): UseRenderAccountResult {
  const [account, setAccount] = useState<RenderAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const data = await getRenderAccount();
      setAccount(data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load Render an Account."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function create(title: string) {
    const created = await createRenderAccount(title);
    setAccount(created);
  }

  async function update(title: string) {
    if (!account) {
      throw new Error("Render an Account not found.");
    }

    const updated = await updateRenderAccount(account.id, title);
    setAccount(updated);
  }

  return {
    account,
    loading,
    error,
    create,
    update,
    refresh,
  };
}
