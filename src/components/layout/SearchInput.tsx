import type { ChangeEvent } from "react";
import { Search } from "lucide-react";

import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
};

/** Shared frontend-only search field with Lucide icon. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
  id = "tt-search-input",
}: SearchInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <div className="tt-search-input">
      <label className="tt-search-input__label" htmlFor={id}>
        {label}
      </label>
      <div className="tt-search-input__field">
        <span className="tt-search-input__icon" aria-hidden="true">
          <Icon icon={Search} size="sm" tone="muted" />
        </span>
        <Input
          id={id}
          type="search"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="off"
          className="tt-search-input__control"
        />
      </div>
    </div>
  );
}
