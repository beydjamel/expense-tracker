import { useState } from "react";
import { api } from "../api";
import { today } from "../format";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export default function TransactionForm({
  categories,
  initial,
  onSaved,
  onCancel,
}) {
  const [form, setForm] = useState({
    type: initial?.type ?? "expense",
    amount: initial?.amount ?? "",
    date: initial?.date ?? today(),
    note: initial?.note ?? "",
    category_id: initial?.category_id ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const body = {
      type: form.type,
      amount: Number(form.amount),
      date: form.date,
      note: form.note.trim() || null,
      category_id: form.category_id === "" ? null : Number(form.category_id),
    };

    try {
      if (initial)
        await api(`/transactions/${initial.id}`, { method: "PUT", body });
      else await api("/transactions", { method: "POST", body });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
    >
      <h2 className="font-semibold text-slate-800">
        {initial ? "Edit transaction" : "New transaction"}
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          className={inputClass}
          name="type"
          value={form.type}
          onChange={update}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input
          className={inputClass}
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Amount (DA)"
          value={form.amount}
          onChange={update}
          required
        />
        <input
          className={inputClass}
          name="date"
          type="date"
          value={form.date}
          onChange={update}
          required
        />
        <select
          className={inputClass}
          name="category_id"
          value={form.category_id}
          onChange={update}
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <input
        className={inputClass}
        name="note"
        placeholder="Note (optional)"
        value={form.note}
        onChange={update}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
