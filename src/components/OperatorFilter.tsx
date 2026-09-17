interface OperatorFilterProps {
  operators: string[];
  active: string | null;
  onChange: (operator: string | null) => void;
}

export function OperatorFilter({ operators, active, onChange }: OperatorFilterProps) {
  if (operators.length === 0) return null;

  const chipClass = (isActive: boolean) =>
    `px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
      isActive
        ? "bg-teal text-ink border-teal"
        : "bg-panel text-slate-300 border-line hover:text-slate-100 hover:border-slate-500"
    }`;

  return (
    <div className="text-xs text-slate-300">
      <p className="font-semibold text-slate-200 mb-1.5">Spotlight an operator</p>
      <div className="flex flex-wrap gap-1.5 max-w-[220px]">
        <button className={chipClass(active === null)} onClick={() => onChange(null)}>
          All
        </button>
        {operators.map((op) => (
          <button key={op} className={chipClass(active === op)} onClick={() => onChange(op === active ? null : op)}>
            {op}
          </button>
        ))}
      </div>
    </div>
  );
}
