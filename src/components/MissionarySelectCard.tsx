import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

import type { Missionary } from "../types/missionary";
import { getErrorMessage } from "../utils/getErrorMessage";

type MissionarySelectCardProps = {
  missionary: Missionary;
  canRemove: boolean;
  onRename: (missionary: Missionary, name: string) => Promise<void>;
  onRequestRemove: (missionary: Missionary) => void;
};

/** Missionary card with open, inline rename, and optional remove actions. */
export function MissionarySelectCard({
  missionary,
  canRemove,
  onRename,
  onRequestRemove,
}: MissionarySelectCardProps) {
  const nameInputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(missionary.display_name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraftName(missionary.display_name);
    }
  }, [editing, missionary.display_name]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function startEditing() {
    setDraftName(missionary.display_name);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    if (saving) return;
    setDraftName(missionary.display_name);
    setError(null);
    setEditing(false);
  }

  async function saveName() {
    const nextName = draftName.trim();

    if (!nextName) {
      setError("Name is required.");
      return;
    }

    if (nextName === missionary.display_name.trim()) {
      setEditing(false);
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onRename(missionary, nextName);
      setEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to rename missionary."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="missionary-select-card">
      <div className="missionary-select-card-main">
        {editing ? (
          <div className="missionary-select-card-edit">
            <label className="visually-hidden" htmlFor={nameInputId}>
              Missionary name
            </label>
            <input
              ref={inputRef}
              id={nameInputId}
              type="text"
              className="missionary-select-card-name-input"
              value={draftName}
              onChange={(event) => {
                setDraftName(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void saveName();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelEditing();
                }
              }}
              disabled={saving}
              aria-invalid={Boolean(error)}
            />
            {error && (
              <p className="missionary-select-card-edit-error" role="alert">
                {error}
              </p>
            )}
          </div>
        ) : (
          <h3 className="missionary-select-card-name">
            {missionary.display_name}
          </h3>
        )}

        {!editing && (
          <Link
            to={`/missionaries/${missionary.id}`}
            className="missionary-select-card-action"
          >
            <span>Open language plan</span>
            <span
              className="missionary-select-card-action-arrow"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        )}
      </div>

      <div className="missionary-select-card-actions">
        {editing ? (
          <>
            <button
              type="button"
              className="missionary-select-save"
              onClick={() => {
                void saveName();
              }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="missionary-select-cancel"
              onClick={cancelEditing}
              disabled={saving}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="missionary-select-edit"
              onClick={startEditing}
            >
              Edit
            </button>
            <button
              type="button"
              className="missionary-select-remove"
              onClick={() => onRequestRemove(missionary)}
              disabled={!canRemove}
              title={
                canRemove
                  ? `Remove ${missionary.display_name}`
                  : "A companionship must keep at least two missionaries"
              }
            >
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
}
