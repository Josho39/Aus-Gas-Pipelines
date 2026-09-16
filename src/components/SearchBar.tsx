interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      value={value}
      placeholder="Search pipelines or facilities…"
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md bg-panel border border-line px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal"
    />
  );
}
