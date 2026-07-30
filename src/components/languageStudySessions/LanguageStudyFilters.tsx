import { Field, Input, Select } from "../ui";
import type { District } from "../../types/district";

type LanguageStudyFiltersProps = {
  districts: District[];
  districtId: string;
  dateKey: string;
  disabled?: boolean;
  onDistrictChange: (districtId: string) => void;
  onDateChange: (dateKey: string) => void;
};

/** District + date selectors for Language Study Sessions. */
export function LanguageStudyFilters({
  districts,
  districtId,
  dateKey,
  disabled = false,
  onDistrictChange,
  onDateChange,
}: LanguageStudyFiltersProps) {
  return (
    <div className="lss-filters">
      <Field label="District" htmlFor="lss-district">
        <Select
          id="lss-district"
          value={districtId}
          disabled={disabled || districts.length === 0}
          onChange={(event) => onDistrictChange(event.target.value)}
        >
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Date" htmlFor="lss-date">
        <Input
          id="lss-date"
          type="date"
          value={dateKey}
          disabled={disabled}
          onChange={(event) => onDateChange(event.target.value)}
        />
      </Field>
    </div>
  );
}
