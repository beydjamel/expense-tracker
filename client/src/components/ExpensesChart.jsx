import { money } from "../format";

const COLORS = [
  "#0f766e",
  "#e11d48",
  "#d97706",
  "#2563eb",
  "#7c3aed",
  "#64748b",
];

export default function ExpensesChart({ data }) {
  const items = (data ?? []).map((d) => ({
    name: d.category,
    total: Number(d.total),
  }));
  const sum = items.reduce((s, i) => s + i.total, 0);

  let offset = 0;
  const slices = items.map((item, i) => {
    const pct = sum === 0 ? 0 : (item.total / sum) * 100;
    const slice = { ...item, pct, offset, color: COLORS[i % COLORS.length] };
    offset += pct;
    return slice;
  });

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-800">
        Expenses by category
      </h2>

      {sum === 0 ? (
        <p className="py-4 text-center text-slate-500">No expenses to show.</p>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <svg
            viewBox="0 0 42 42"
            className="h-44 w-44 shrink-0"
            role="img"
            aria-label="Expenses by category"
          >
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="6"
            />
            {slices.map((s) => (
              <circle
                key={s.name}
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                stroke={s.color}
                strokeWidth="6"
                strokeDasharray={`${s.pct} ${100 - s.pct}`}
                strokeDashoffset={-s.offset}
                transform="rotate(-90 21 21)"
              />
            ))}
          </svg>

          <ul className="w-full space-y-2 text-sm">
            {slices.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="truncate text-slate-700">{s.name}</span>
                </span>
                <span className="shrink-0 text-slate-600">
                  {money(s.total)} · {s.pct.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
