import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export default function WorkersPanel() {
  const { logout } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleError = useCallback(
    (err) => {
      if (err.status === 401) logout();
      else setError(err.message);
    },
    [logout],
  );

  const load = useCallback(() => {
    api("/workers")
      .then((data) => setWorkers(data.workers))
      .catch(handleError);
  }, [handleError]);

  useEffect(() => {
    load();
  }, [load]);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api("/workers", { method: "POST", body: form });
      setForm({ name: "", email: "", password: "" });
      load();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(worker) {
    if (!window.confirm(`Delete the account of ${worker.name}?`)) return;
    try {
      await api(`/workers/${worker.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-slate-800">Workers</h2>
      <p className="text-sm text-slate-500">
        Workers can only log expenses. They cannot see income, balance or edit
        anything.
      </p>

      {workers.length === 0 ? (
        <p className="text-sm text-slate-500">No workers yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {workers.map((w) => (
            <li
              key={w.id}
              className="flex items-center justify-between gap-2 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{w.name}</p>
                <p className="truncate text-sm text-slate-500">{w.email}</p>
              </div>
              <button
                onClick={() => handleDelete(w)}
                className="shrink-0 text-sm text-slate-500 hover:text-rose-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleCreate}
        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        <input
          className={inputClass}
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={update}
          required
        />
        <input
          className={inputClass}
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={update}
          required
        />
        <input
          className={inputClass}
          name="password"
          type="password"
          placeholder="Password (8+)"
          value={form.password}
          onChange={update}
          required
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-60 sm:col-span-3"
        >
          {saving ? "Creating..." : "Create worker account"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
