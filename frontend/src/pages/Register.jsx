import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";

const inputClass =
  "w-full rounded-xl border border-[#dedfd5] bg-[#fffefa] px-4 py-3 text-sm text-[#30372f] placeholder:text-[#a1a49a] outline-none transition focus:border-[#718771] focus:ring-4 focus:ring-[#718771]/10";

function BalidLogo() {
  return (
    <div className="flex items-center justify-center gap-3" aria-label="BALID">
      <svg
        viewBox="0 0 48 48"
        className="h-12 w-12 text-[#536b56]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M24 42C23 28 27 15 40 5C42 21 37 33 24 42Z"
          fill="currentColor"
        />
        <path
          d="M22 42C21 29 14 20 5 17C5 30 11 39 22 42Z"
          fill="currentColor"
        />
        <path
          d="M23 42C29 33 35 30 44 30C39 40 32 43 23 42Z"
          fill="currentColor"
        />
        <path
          d="M24 42C24 29 30 16 40 5"
          stroke="#fffefa"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      <span className="text-4xl font-semibold tracking-[0.12em] text-[#536b56]">
        BALID
      </span>
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="">
      <div className="mb-6">
        <BalidLogo />
      </div>

      <div className="mb-6 border-t border-[#e9e8df]" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#e8c9c0] bg-[#fff4f0] px-4 py-3 text-sm leading-6 text-[#9b4938]"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-[#454b41]"
          >
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-[#454b41]"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-[#454b41]"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            className={inputClass}
          />
          <p className="mt-2 text-xs leading-5 text-[#898c82]">
            Use at least 8 characters.
          </p>
        </div>

        <div>
          <label
            htmlFor="password_confirmation"
            className="mb-2 block text-sm font-medium text-[#454b41]"
          >
            Confirm password
          </label>
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            value={form.password_confirmation}
            onChange={handleChange}
            placeholder="Re-enter your password"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#536b56] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#435846] focus:outline-none focus:ring-4 focus:ring-[#718771]/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <div className="my-6 border-t border-[#e9e8df]" />

      <p className="text-center text-sm text-[#777b70]">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-[#536b56] transition hover:text-[#354a38] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
