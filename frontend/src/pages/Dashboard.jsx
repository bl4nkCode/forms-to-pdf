import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleConnection from "../components/GoogleConnection";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600">Forms to PDF</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.name}</span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-2xl font-semibold text-slate-800">
          Welcome, {user.name}
        </h2>
        <GoogleConnection />
      </main>
    </div>
  );
}
