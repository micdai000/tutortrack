import { useState, type FormEvent } from "react";

import { getErrorMessage } from "../utils/getErrorMessage";

type CreateDistrictFormProps = {
  onCreate: (name: string) => Promise<void>;
};

export function CreateDistrictForm({ onCreate }: CreateDistrictFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onCreate(name);
      setName("");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to add district. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="create-district-form" onSubmit={handleSubmit}>
      <label htmlFor="district-name">District name</label>
      <div className="create-district-form-row">
        <input
          id="district-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. 14-Q"
          required
          maxLength={100}
          disabled={submitting}
          aria-invalid={error ? true : undefined}
        />
        <button type="submit" disabled={submitting || !name.trim()}>
          {submitting ? "Adding..." : "Add district"}
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
