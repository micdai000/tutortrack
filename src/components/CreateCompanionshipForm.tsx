import { useState, type FormEvent } from "react";

import type { CompanionshipSize } from "../types/companionship";
import { getErrorMessage } from "../utils/getErrorMessage";

type CreateCompanionshipFormProps = {
  onCreate: (missionaryNames: string[]) => Promise<void>;
  onCancel: () => void;
};

const emptyNamesForSize = (size: CompanionshipSize): string[] =>
  Array.from({ length: size }, () => "");

export function CreateCompanionshipForm({
  onCreate,
  onCancel,
}: CreateCompanionshipFormProps) {
  const [size, setSize] = useState<CompanionshipSize>(2);
  const [names, setNames] = useState<string[]>(emptyNamesForSize(2));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSizeChange(nextSize: CompanionshipSize) {
    setSize(nextSize);
    setNames((current) => {
      const next = emptyNamesForSize(nextSize);
      for (let index = 0; index < nextSize; index += 1) {
        next[index] = current[index] ?? "";
      }
      return next;
    });
  }

  function updateName(index: number, value: string) {
    setNames((current) =>
      current.map((name, nameIndex) => (nameIndex === index ? value : name))
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onCreate(names);
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to add companionship. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="create-companionship-form" onSubmit={handleSubmit}>
      <fieldset className="create-companionship-size">
        <legend>How many missionaries?</legend>

        <label>
          <input
            type="radio"
            name="companionship-size"
            checked={size === 2}
            onChange={() => handleSizeChange(2)}
            disabled={submitting}
          />
          Duo (2)
        </label>

        <label>
          <input
            type="radio"
            name="companionship-size"
            checked={size === 3}
            onChange={() => handleSizeChange(3)}
            disabled={submitting}
          />
          Trio (3)
        </label>
      </fieldset>

      <div className="create-companionship-names">
        {names.map((name, index) => (
          <div key={`name-${index}`} className="create-companionship-field">
            <label htmlFor={`missionary-name-${index}`}>
              Missionary {index + 1}
            </label>
            <input
              id={`missionary-name-${index}`}
              type="text"
              value={name}
              onChange={(event) => updateName(index, event.target.value)}
              placeholder={
                index === 0 ? "e.g. Elder Smith" : "e.g. Elder Jones"
              }
              required
              maxLength={120}
              disabled={submitting}
              autoFocus={index === 0}
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="create-companionship-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? "Adding..." : "Add companionship"}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
