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

/** Frontend-only search field for filtering loaded companionships. */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search companionships...",
  label = "Search companionships",
  id = "district-companionship-search",
}: SearchBarProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <div className="district-search">
      <label className="district-search__label" htmlFor={id}>
        {label}
      </label>
      <div className="district-search__field">
        <span className="district-search__icon" aria-hidden="true">
          <Icon icon={Search} size="sm" tone="muted" />
        </span>
        <Input
          id={id}
          type="search"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="off"
          className="district-search__input"
        />
      </div>
    </div>
  );
}
