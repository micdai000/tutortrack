import { useState, type FormEvent } from "react";

import { getErrorMessage } from "../utils/getErrorMessage";

type AddMissionaryFormProps = {
  onAdd: (name: string) => Promise<void>;
  onCancel: () => void;
};

export function AddMissionaryForm({ onAdd, onCancel }: AddMissionaryFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onAdd(name);
      setName("");
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to add missionary. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="add-missionary-form" onSubmit={handleSubmit}>
      <label htmlFor="new-missionary-name">Name</label>
      <div className="add-missionary-form-row">
        <input
          id="new-missionary-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Elder Brown"
          required
          maxLength={120}
          disabled={submitting}
          autoFocus
        />
        <button type="submit" disabled={submitting || !name.trim()}>
          {submitting ? "Adding..." : "Add missionary"}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
