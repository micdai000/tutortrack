import { SearchInput } from "../layout/SearchInput";

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
  return (
    <div className="district-search">
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
