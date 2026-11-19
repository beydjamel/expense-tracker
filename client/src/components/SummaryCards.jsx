import { money } from '../format'

export default function SummaryCards({ summary }) {
  const cards = [
    { label: 'Income', value: summary?.income, color: 'text-emerald-700' },
    { label: 'Expenses', value: summary?.expense, color: 'text-rose-700' },
    { label: 'Balance', value: summary?.balance, color: 'text-slate-900' },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{c.label}</p>
          <p className={`mt-1 text-xl font-bold ${c.color}`}>
            {c.value === undefined ? '...' : money(c.value)}
          </p>
        </div>
      ))}
    </div>
  )
}