
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getErrorMessage } from '../utils/errors'

export default function Forms() {
  const [forms, setForms] = useState([])
  const [nextToken, setNextToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)

  const [formUrl, setFormUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importedForm, setImportedForm] = useState(null)

  const navigate = useNavigate()

  const load = async (pageToken = null) => {
    try {
      const res = await api.get('/forms', {
        params: pageToken ? { page_token: pageToken } : {},
      })

      setForms((prev) =>
        pageToken ? [...prev, ...res.data.forms] : res.data.forms,
      )
      setNextToken(res.data.next_page_token)
      setError(null)
    } catch (err) {
      setError({
        message: getErrorMessage(err),
        code: err.response?.data?.code,
      })
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

  const handleImport = async (event) => {
    event.preventDefault()
    setImportError('')
    setImportedForm(null)

    if (!formUrl.trim()) {
      setImportError('Please paste a Google Forms link.')
      return
    }

    setImporting(true)

    try {
      const res = await api.post('/forms/import', {
        url: formUrl.trim(),
      })

      setImportedForm(res.data)
    } catch (err) {
      setImportError(getErrorMessage(err))
    } finally {
      setImporting(false)
    }
  }

  const needsGoogle =
    error &&
    ['google_not_connected', 'google_reconnect'].includes(error.code)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-slate-800">
          My forms
        </h2>
        <p className="text-sm text-slate-500">
          Browse your Google Forms or import one using its link.
        </p>
      </div>

      {/* Import a form using its Google Forms link */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M12 18v-6" />
              <path d="m9 15 3-3 3 3" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Import Google Form
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Paste a Google Forms link to open it and generate a PDF.
            </p>
          </div>
        </div>

        <form onSubmit={handleImport} className="space-y-3">
          <label
            htmlFor="google-form-url"
            className="block text-sm font-medium text-slate-700"
          >
            Google Forms URL
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="google-form-url"
              type="url"
              value={formUrl}
              onChange={(event) => setFormUrl(event.target.value)}
              placeholder="https://docs.google.com/forms/d/..."
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              disabled={importing}
            />

            <button
              type="submit"
              disabled={importing}
              className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importing ? 'Importing...' : 'Import form'}
            </button>
          </div>
        </form>

        {importError && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {importError}
          </p>
        )}

        {importedForm && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-green-900">
                {importedForm.title}
              </p>
              <p className="mt-1 text-sm text-green-700">
                Form imported successfully. You can now open it to export a PDF.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/forms/${importedForm.id}`)}
              className="shrink-0 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Open form
            </button>
          </div>
        )}
      </section>

      {/* Existing Google Forms list */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          Forms in your Google Drive
        </h3>

        {loading && (
          <p className="text-slate-500">Loading your forms...</p>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error.message}</p>
            {needsGoogle && (
              <Link to="/dashboard" className="font-medium underline">
                Go to the dashboard to connect Google
              </Link>
            )}
          </div>
        )}

        {!loading && !error && forms.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">
            No Google Forms found in your Drive. You can import a form using
            the link above.
          </p>
        )}

        {forms.length > 0 && (
          <ul className="divide-y divide-slate-100 rounded-xl bg-white shadow-sm">
            {forms.map((form) => (
              <li key={form.id}>
                <Link
                  to={`/forms/${form.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-800">
                    {form.title}
                  </span>
                  <span className="shrink-0 text-sm text-slate-500">
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
      </section>
    </div>
  )
}
