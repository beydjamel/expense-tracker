import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { currentMonth, money } from "../format";
import SummaryCards from "../components/SummaryCards";
import TransactionForm from "../components/TransactionForm";

const inputClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [categoryId, setCategoryId] = useState("");
  const [transactions, setTransactions] = useState(null);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const isAdmin = user.role === "admin";

  useEffect(() => {
    if (!month || !isAdmin) return;
    let cancelled = false;

    const qs = new URLSearchParams({ month });
    if (categoryId) qs.set("category_id", categoryId);

    Promise.all([
      api(`/transactions?${qs}`),
      api(`/transactions/summary?month=${month}`),
      api("/categories"),
    ])
      .then(([tx, sum, cats]) => {
        if (cancelled) return;
        setTransactions(tx.transactions);
        setSummary(sum);
        setCategories(cats.categories);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) logout();
        else setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [month, categoryId, version, isAdmin, logout]);

  const refresh = () => setVersion((v) => v + 1);

  async function handleDelete(t) {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await api(`/transactions/${t.id}`, { method: "DELETE" });
      refresh();
    } catch (err) {
      if (err.status === 401) logout();
      else setError(err.message);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    try {
      await api("/categories", { method: "POST", body: { name } });
      setNewCategory("");
      refresh();
    } catch (err) {
      if (err.status === 401) logout();
      else setError(err.message);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 px-4">
        <p className="text-slate-700">The worker page is coming soon.</p>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
        >
          Log out
        </button>
      </div>
    );
  }

  const categoryNames = Object.fromEntries(
    categories.map((c) => [c.id, c.name]),
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-teal-700">Expense Tracker</h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">
              {user.name}
            </span>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            className={inputClass}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <select
            className={inputClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditing("new");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="ml-auto rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
          >
            + Add transaction
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {editing && (
          <TransactionForm
            key={editing === "new" ? "new" : editing.id}
            categories={categories}
            initial={editing === "new" ? null : editing}
            onSaved={() => {
              setEditing(null);
              refresh();
            }}
            onCancel={() => setEditing(null)}
          />
        )}

        <SummaryCards summary={summary} />

        <form
          onSubmit={handleAddCategory}
          className="flex gap-2 rounded-2xl bg-white p-4 shadow-sm"
        >
          <input
            className={`${inputClass} flex-1`}
            placeholder="New category (e.g. Food)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Add category
          </button>
        </form>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold text-slate-800">Transactions</h2>

          {transactions === null && !error && (
            <p className="text-slate-500">Loading...</p>
          )}

          {transactions !== null && transactions.length === 0 && (
            <p className="py-6 text-center text-slate-500">
              No transactions for this selection. Add your first one!
            </p>
          )}

          {transactions !== null && transactions.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {t.note || "No note"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {t.date} ·{" "}
                      {categoryNames[t.category_id] ?? "Uncategorized"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={
                        t.type === "income"
                          ? "font-semibold text-emerald-700"
                          : "font-semibold text-rose-700"
                      }
                    >
                      {t.type === "income" ? "+" : "-"}
                      {money(t.amount)}
                    </span>
                    <button
                      onClick={() => {
                        setEditing(t);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-sm text-slate-500 hover:text-teal-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t)}
                      className="text-sm text-slate-500 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
