import { Link } from 'react-router-dom'
import GoogleConnection from '../components/GoogleConnection'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800">Welcome, {user.name}</h2>

      <GoogleConnection />

      <Link
        to="/forms"
        className="inline-block rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700"
      >
        View my forms
      </Link>
    </div>
  )
}