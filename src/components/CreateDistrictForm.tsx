import { useState, type FormEvent } from "react";

import { Button, Input } from "./ui";
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
        <Input
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
        <Button type="submit" disabled={submitting || !name.trim()}>
          {submitting ? "Adding..." : "Add district"}
        </Button>
      </div>
      {error && (
        <p className="tt-form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
