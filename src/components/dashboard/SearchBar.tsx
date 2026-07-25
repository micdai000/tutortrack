import { SearchInput } from "../layout/SearchInput";

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
  return (
    <div className="dashboard-search">
      <SearchInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        label={label}
        id={id}
      />
    </div>
  );
}
