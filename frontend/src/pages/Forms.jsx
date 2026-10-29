
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getErrorMessage } from '../utils/errors'

function FileIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M13.5 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9.5z" />
      <path d="M13 3v7h7" />
      <path d="M8 14h8M8 17.5h5" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading forms">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex animate-pulse items-center gap-4 rounded-2xl border border-[#e9e7de] bg-[#fffefa] p-4 sm:p-5"
        >
          <div className="h-11 w-11 shrink-0 rounded-xl bg-[#efeee6]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 rounded bg-[#efeee6]" />
            <div className="h-2.5 w-1/4 rounded bg-[#f2f1eb]" />
          </div>
        </div>
      ))}
    </div>
  )
}

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
    if (!nextToken || loadingMore) return
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
    <div className="space-y-8 sm:space-y-10">
      {/* Page heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#858a7c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#718a70]" />
            Document library
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-[#30372f] sm:text-4xl">
            My forms
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#85877d] sm:text-base">
            Access your Google Forms, import a form by link, and prepare your
            documents for PDF export.
          </p>
        </div>

        <Link
          to="/exports"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#e3e1d7] bg-[#fffefa] px-4 py-2.5 text-sm font-medium text-[#586653] transition hover:border-[#cbd7c6] hover:bg-[#f3f5ee]"
        >
          View exports
          <ArrowIcon />
        </Link>
      </section>

      {/* Import form panel */}
      <section className="overflow-hidden rounded-3xl border border-[#e6e5da] bg-[#fffefa]">
        <div className="border-b border-[#eeece3] bg-[#f3f3eb] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e2e9dd] text-[#536b56]">
              <FileIcon />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#343a32]">
                Import a Google Form
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#85877d]">
                Have a form link? Paste it below to add it to your workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <form onSubmit={handleImport} className="space-y-3">
            <label
              htmlFor="google-form-url"
              className="block text-sm font-medium text-[#4d5549]"
            >
              Google Forms URL
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#a0a196]"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 4 4" />
                </svg>

                <input
                  id="google-form-url"
                  type="url"
                  value={formUrl}
                  onChange={(event) => setFormUrl(event.target.value)}
                  placeholder="https://docs.google.com/forms/d/..."
                  className="w-full rounded-xl border border-[#e1dfd5] bg-[#fdfcf8] py-3.5 pl-11 pr-4 text-sm text-[#343a32] outline-none transition placeholder:text-[#aaa99f] focus:border-[#84977f] focus:ring-4 focus:ring-[#e8eee4]"
                  disabled={importing}
                />
              </div>

              <button
                type="submit"
                disabled={importing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#536b56] px-5 py-3.5 text-sm font-medium text-white transition hover:bg-[#435846] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importing ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />
                      <path
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Importing...
                  </>
                ) : (
                  <>
                    Import form
                    <ArrowIcon />
                  </>
                )}
              </button>
            </div>

            <p className="text-xs leading-5 text-[#96978c]">
              Paste a Google Forms link that your Google account can access.
            </p>
          </form>

          {importError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-[#edd4cc] bg-[#fcf1ed] px-4 py-3 text-sm text-[#9b4d3d]"
            >
              {importError}
            </div>
          )}

          {importedForm && (
            <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#d9e3d4] bg-[#f1f5ed] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dce8d6] text-[#536b56]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </div>

                <div>
                  <p className="font-medium text-[#405844]">
                    {importedForm.title}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#73836d]">
                    Form imported successfully. Open it to review questions
                    and export a PDF.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/forms/${importedForm.id}`)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#536b56] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#435846]"
              >
                Open form
                <ArrowIcon />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Google Drive form list */}
      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#343a32]">
              Forms in Google Drive
            </h2>
            <p className="mt-1 text-sm text-[#898b80]">
              Select a form to view its questions, responses, and PDF options.
            </p>
          </div>

          {!loading && !error && forms.length > 0 && (
            <span className="w-fit rounded-full border border-[#e5e4d9] bg-[#fffefa] px-3 py-1.5 text-xs font-medium text-[#72766a]">
              {forms.length} loaded
            </span>
          )}
        </div>

        {loading && <LoadingSkeleton />}

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-[#edd4cc] bg-[#fcf1ed] p-5 text-sm text-[#9b4d3d]"
          >
            <p>{error.message}</p>
            {needsGoogle && (
              <Link
                to="/dashboard"
                className="mt-3 inline-flex items-center gap-2 font-semibold underline underline-offset-4"
              >
                Go to dashboard to connect Google
                <ArrowIcon />
              </Link>
            )}
          </div>
        )}

        {!loading && !error && forms.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#dcdccf] bg-[#fffefa] px-5 py-12 text-center sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf1e8] text-[#687d62]">
              <FileIcon className="h-8 w-8" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-[#343a32]">
              Your form library is empty
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#85877d]">
              No Google Forms were found in your Drive. Import a form using
              its link above to get started.
            </p>
          </div>
        )}

        {!loading && !error && forms.length > 0 && (
          <div className="space-y-3">
            {forms.map((form) => (
              <Link
                key={form.id}
                to={`/forms/${form.id}`}
                className="group flex min-w-0 items-center gap-3 rounded-2xl border border-[#e7e5db] bg-[#fffefa] p-4 transition duration-200 hover:border-[#cbd7c6] hover:bg-[#fdfdf8] hover:shadow-sm sm:gap-4 sm:p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf1e8] text-[#647b60] transition group-hover:bg-[#e3ebde]">
                  <FileIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-[#3c4339] transition group-hover:text-[#536b56] sm:text-base">
                    {form.title || 'Untitled form'}
                  </h3>
                  <p className="mt-1 text-xs text-[#96978c]">
                    {form.modified_at
                      ? `Updated ${new Date(form.modified_at).toLocaleDateString()}`
                      : 'Google Form'}
                  </p>
                </div>

                <span className="hidden shrink-0 items-center gap-2 rounded-lg border border-[#e7e5db] px-3 py-2 text-xs font-medium text-[#687362] transition group-hover:border-[#d4dfce] group-hover:bg-[#edf1e8] sm:inline-flex">
                  Open form
                  <ArrowIcon />
                </span>

                <span className="shrink-0 text-[#a1a296] sm:hidden">
                  <ArrowIcon />
                </span>
              </Link>
            ))}
          </div>
        )}

        {nextToken && !loading && !error && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e0ded4] bg-[#fffefa] px-5 py-3 text-sm font-medium text-[#586653] transition hover:border-[#cbd7c6] hover:bg-[#f2f4ed] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Loading forms...
                </>
              ) : (
                'Load more forms'
              )}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
