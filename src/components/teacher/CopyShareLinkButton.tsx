import { useCopyShareLink } from "../../hooks/useCopyShareLink";
import type { TeacherShareType } from "../../types/teacherShare";
import "../../styles/share-link.css";

type CopyShareLinkButtonProps = {
  shareType: TeacherShareType;
  resourceId: string | undefined;
  /** inline = sit beside Open Teacher View; stacked = Teacher View toolbar */
  layout?: "inline" | "stacked";
};

/** Creates/reuses a secure share token and copies the public URL. */
export function CopyShareLinkButton({
  shareType,
  resourceId,
  layout = "stacked",
}: CopyShareLinkButtonProps) {
  const { copying, status, error, copyShareLink } = useCopyShareLink(
    shareType,
    resourceId
  );

  return (
    <div
      className={
        layout === "inline"
          ? "teacher-share-actions teacher-share-actions--inline"
          : "teacher-share-actions"
      }
    >
      <button
        type="button"
        className="teacher-share-copy-button"
        onClick={() => {
          void copyShareLink();
        }}
        disabled={copying || !resourceId}
      >
        {copying ? "Preparing link..." : "Copy Share Link"}
      </button>

      {status && (
        <p className="teacher-share-status" role="status">
          {status}
        </p>
      )}

      {error && (
        <p className="teacher-share-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
