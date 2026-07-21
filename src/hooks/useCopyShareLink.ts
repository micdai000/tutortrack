import { useState } from "react";

import {
  buildShareUrl,
  getOrCreateTeacherShare,
} from "../services/teacherShareService";
import type { TeacherShareType } from "../types/teacherShare";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseCopyShareLinkResult = {
  copying: boolean;
  status: string | null;
  error: string | null;
  copyShareLink: () => Promise<void>;
};

/** Reuses a persistent share token when possible, then copies the public URL. */
export function useCopyShareLink(
  shareType: TeacherShareType,
  resourceId: string | undefined
): UseCopyShareLinkResult {
  const [copying, setCopying] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function copyShareLink() {
    if (!resourceId) {
      setError("Unable to create a share link for this view.");
      setStatus(null);
      return;
    }

    setCopying(true);
    setError(null);
    setStatus(null);

    try {
      const { token } = await getOrCreateTeacherShare(shareType, resourceId);
      const url = buildShareUrl(token);

      await navigator.clipboard.writeText(url);
      setStatus("Share link copied!");
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to copy share link. Please try again.")
      );
    } finally {
      setCopying(false);
    }
  }

  return { copying, status, error, copyShareLink };
}
