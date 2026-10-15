import { FIELD_NAMES, type FieldSlug } from "@/lib/domain/fields";

interface FieldBadgeProps {
  field: FieldSlug;
}

export function FieldBadge({ field }: FieldBadgeProps) {
  return (
    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
      {FIELD_NAMES[field]}
    </span>
  );
}
