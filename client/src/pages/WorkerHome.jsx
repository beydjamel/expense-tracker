import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export default function WorkerHome() {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ amount: "", note: "", category_id: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/expenses/categories")
      .then((data) => setCategories(data.categories))
      .catch((err) => {
        if (err.status === 401) logout();
        else setError(err.message);
      });
  }, [logout]);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await api("/expenses", {
        method: "POST",
        body: {
          amount: Number(form.amount),
          note: form.note.trim() || null,
          category_id:
            form.category_id === "" ? null : Number(form.category_id),
        },
      });
      setForm({ amount: "", note: "", category_id: "" });
      setMessage("Expense saved");
    } catch (err) {
      if (err.status === 401) logout();
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-teal-700">Expense Tracker</h1>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold text-slate-800">
            Hi {user.name}, log an expense
          </h2>

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
          <input
            className={inputClass}
            name="note"
            placeholder="Note (optional)"
            value={form.note}
            onChange={update}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-teal-700 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save expense"}
          </button>
        </form>
      </main>
    </div>
  );
}
