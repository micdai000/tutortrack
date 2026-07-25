import type { ChangeEvent } from "react";
import { Search } from "lucide-react";

import { Icon } from "../ui/Icon";
import { Input } from "../ui/Input";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
};

/** Frontend-only search input for filtering dashboard lists. */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
  id = "dashboard-search",
}: SearchBarProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <div className="dashboard-search">
      <label className="dashboard-search__label" htmlFor={id}>
        {label}
      </label>
      <div className="dashboard-search__field">
        <span className="dashboard-search__icon" aria-hidden="true">
          <Icon icon={Search} size="sm" tone="muted" />
        </span>
        <Input
          id={id}
          type="search"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="off"
          className="dashboard-search__input"
        />
      </div>
    </div>
  );
}
