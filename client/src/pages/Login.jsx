import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

export default function Login() {
  const { user, loading, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-teal-700">
          {isLogin ? "Log in" : "Create account"}
        </h1>

        {!isLogin && (
          <input
            className={inputClass}
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={update}
            required
          />
        )}
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
          placeholder="Password (8+ characters)"
          value={form.password}
          onChange={update}
          required
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-teal-700 py-2 font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? "Please wait..." : isLogin ? "Log in" : "Sign up"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(isLogin ? "register" : "login");
            setError("");
          }}
          className="w-full text-sm text-slate-600 hover:text-teal-700"
        >
          {isLogin
            ? "No account yet? Sign up"
            : "Already have an account? Log in"}
        </button>
      </form>
    </div>
  );
}
