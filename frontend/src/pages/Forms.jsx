import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { getErrorMessage } from '../utils/errors'

export default function Forms() {
  const [forms, setForms] = useState([])
  const [nextToken, setNextToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  const load = async (pageToken = null) => {
    try {
      const res = await api.get('/forms', {
        params: pageToken ? { page_token: pageToken } : {},
      })
      setForms((prev) => (pageToken ? [...prev, ...res.data.forms] : res.data.forms))
      setNextToken(res.data.next_page_token)
    } catch (err) {
      setError({ message: getErrorMessage(err), code: err.response?.data?.code })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const loadMore = () => {
    setLoadingMore(true)
    load(nextToken)
  }

  const needsGoogle = error && ['google_not_connected', 'google_reconnect'].includes(error.code)

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">My forms</h2>

      {loading && <p className="text-slate-500">Loading your forms...</p>}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          <p>{error.message}</p>
          {needsGoogle && (
            <Link to="/dashboard" className="underline font-medium">
              Go to the dashboard to connect Google
            </Link>
          )}
        </div>
      )}

      {!loading && !error && forms.length === 0 && (
        <p className="text-slate-600">No Google Forms found in your Drive.</p>
      )}

      {forms.length > 0 && (
        <ul className="bg-white rounded-xl shadow divide-y divide-slate-100">
          {forms.map((form) => (
            <li key={form.id}>
              <Link
                to={`/forms/${form.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
              >
                <span className="font-medium text-slate-800">{form.title}</span>
                <span className="text-sm text-slate-500">
                  {form.modified_at
                    ? `Updated ${new Date(form.modified_at).toLocaleDateString()}`
                    : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {nextToken && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
        >
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  )
}