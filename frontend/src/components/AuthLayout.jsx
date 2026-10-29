export default function AuthLayout({ title, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h2 className="text-lg text-slate-700 mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
