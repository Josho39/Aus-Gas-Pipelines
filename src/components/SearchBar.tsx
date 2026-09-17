interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <input
      type="text"
      value={value}
      placeholder="Search contracts…"
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md bg-panel border border-line px-3 py-2 text-sm text-fg placeholder:text-fgmuted focus:outline-none focus:ring-2 focus:ring-teal"
    />
  );
}
