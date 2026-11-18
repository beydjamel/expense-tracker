import { useAuth } from "../AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-teal-700">Expense Tracker</h1>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <p className="text-slate-700">Welcome, {user.name}</p>
      </main>
    </div>
  );
}
