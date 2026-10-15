interface TagListProps {
  tags: string[];
}

export function TagList({ tags }: TagListProps) {
  if (tags.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-wrap gap-2 text-sm text-slate-500">
      {tags.map((tag) => (
        <li key={tag}>#{tag}</li>
      ))}
    </ul>
  );
}
