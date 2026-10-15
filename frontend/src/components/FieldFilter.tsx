import { FIELD_NAMES, FIELD_SLUGS, type FieldSlug } from "@/lib/domain/fields";

const ALL_FIELDS = "";

interface FieldFilterProps {
  value: FieldSlug | null;
  onChange: (value: FieldSlug | null) => void;
}

function isFieldSlug(value: string): value is FieldSlug {
  return (FIELD_SLUGS as readonly string[]).includes(value);
}

export function FieldFilter({ value, onChange }: FieldFilterProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      Dziedzina
      <select
        className="rounded-md border border-slate-300 bg-white px-2 py-1"
        value={value ?? ALL_FIELDS}
        onChange={(event) => onChange(isFieldSlug(event.target.value) ? event.target.value : null)}
      >
        <option value={ALL_FIELDS}>Wszystkie</option>
        {FIELD_SLUGS.map((slug) => (
          <option key={slug} value={slug}>
            {FIELD_NAMES[slug]}
          </option>
        ))}
      </select>
    </label>
  );
}
