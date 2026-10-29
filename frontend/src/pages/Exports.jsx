
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { downloadExport } from '../utils/download'
import { getErrorMessage } from '../utils/errors'
import { useEffect, useRef, useState } from 'react'

const typeLabels = {
  blank: 'Blank form',
  responses: 'Responses',
  summary: 'Summary',
}

const paperLabels = { a4: 'A4', letter: 'Letter' }

const statusStyles = {
  completed: 'border-[#dce7d6] bg-[#edf4e9] text-[#4e6c4b]',
  failed: 'border-[#efd7d0] bg-[#fcf0ec] text-[#a45142]',
  processing: 'border-[#eadfc5] bg-[#faf3e4] text-[#94723c]',
  pending: 'border-[#e6e5da] bg-[#f3f2eb] text-[#797b70]',
}

function DocumentIcon({ className = 'h-5 w-5' }) {
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

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5M12 15V3" />
    </svg>
  )
}

function TrashIcon() {
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
      <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  )
}

function StatusBadge({ status }) {
  const labels = {
    completed: 'Completed',
    failed: 'Failed',
    processing: 'Processing',
    pending: 'Queued',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
        statusStyles[status] || statusStyles.pending
      }`}
    >
      {(status === 'pending' || status === 'processing') && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {labels[status] || status}
    </span>
  )
}

function describeOptions(exportRecord) {
  const o = exportRecord.options || {}
  const parts = []

  if (o.paper) parts.push(paperLabels[o.paper] || o.paper)

  if (exportRecord.type === 'blank') {
    parts.push(
      o.answer_lines === false ? 'No answer lines' : 'With answer lines',
    )
  } else if (exportRecord.type === 'responses') {
    parts.push(o.layout === 'per_page' ? 'One response per page' : 'Table layout')
  } else if (exportRecord.type === 'summary') {
    parts.push(
      o.text_samples === false ? 'No text samples' : 'With text samples',
    )
  }

  return parts.join(' · ')
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-[#dcdccf] bg-[#fffefa] px-5 py-14 text-center sm:px-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9efe4] text-[#536b56]">
        <DocumentIcon className="h-7 w-7" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-[#343a32]">
        No exports yet
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#85877d]">
        Your generated PDFs will appear here. Choose a form to create your
        first document.
      </p>

      <Link
        to="/forms"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#536b56] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#435846] focus:outline-none focus:ring-2 focus:ring-[#a9b9a1] focus:ring-offset-2"
      >
        Browse my forms
        <span className="ml-2" aria-hidden="true">→</span>
      </Link>
    </div>
  )
}

export default function Exports() {
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const silentRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    if (!silentRef.current) setLoading(true)
    silentRef.current = false

    api
      .get('/exports', { params: { page } })
      .then((res) => {
        if (cancelled) return

        if (res.data.data.length === 0 && page > 1) {
          setPage(page - 1)
          return
        }

        setResult(res.data)
        setError('')
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, reloadKey])

  const hasActive = (result?.data ?? []).some(
    (e) => e.status === 'pending' || e.status === 'processing',
  )

  useEffect(() => {
    if (!hasActive) return

    const timer = setTimeout(() => {
      silentRef.current = true
      setReloadKey((k) => k + 1)
    }, 3000)

    return () => clearTimeout(timer)
  }, [hasActive, result])

  const handleDownload = async (exportRecord) => {
    setBusyId(exportRecord.id)
    setNotice(null)

    try {
      await downloadExport(exportRecord)
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (exportRecord) => {
    if (
      !window.confirm(
        `Delete "${exportRecord.filename}" and its PDF file? This cannot be undone.`,
      )
    ) {
      return
    }

    setBusyId(exportRecord.id)
    setNotice(null)

    try {
      await api.delete(`/exports/${exportRecord.id}`)
      setNotice({ type: 'success', text: 'Export deleted.' })
      setReloadKey((k) => k + 1)
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) })
    } finally {
      setBusyId(null)
    }
  }

  const exports = result?.data ?? []

  return (
    <div className="space-y-7 sm:space-y-8">
      {/* Page heading */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#858b7a]">
            Your documents
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-[#30372f] sm:text-3xl">
            Export history
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-[#85877d]">
            View your generated PDFs, check their status, and download them
            whenever you need them.
          </p>
        </div>

        <Link
          to="/forms"
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#536b56] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#435846] focus:outline-none focus:ring-2 focus:ring-[#a9b9a1] focus:ring-offset-2"
        >
          <span className="text-lg leading-none" aria-hidden="true">+</span>
          Create an export
        </Link>
      </section>

      {/* Overview */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e7e5db] bg-[#fffefa] p-5">
          <p className="text-sm text-[#85877d]">Total exports</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[#343a32]">
            {result ? result.total : '—'}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e7e5db] bg-[#fffefa] p-5">
          <p className="text-sm text-[#85877d]">Completed</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[#536b56]">
            {result
              ? exports.filter((item) => item.status === 'completed').length
              : '—'}
          </p>
          <p className="mt-1 text-xs text-[#999a90]">On this page</p>
        </div>

        <div className="rounded-2xl border border-[#e7e5db] bg-[#fffefa] p-5">
          <p className="text-sm text-[#85877d]">In progress</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[#94723c]">
            {result
              ? exports.filter(
                  (item) =>
                    item.status === 'pending' || item.status === 'processing',
                ).length
              : '—'}
          </p>
          <p className="mt-1 text-xs text-[#999a90]">On this page</p>
        </div>
      </section>

      {/* Notices */}
      {notice && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            notice.type === 'success'
              ? 'border-[#dce7d6] bg-[#edf4e9] text-[#4e6c4b]'
              : 'border-[#efd7d0] bg-[#fcf0ec] text-[#a45142]'
          }`}
        >
          {notice.text}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-[#efd7d0] bg-[#fcf0ec] px-4 py-3 text-sm text-[#a45142]"
        >
          <p className="font-semibold">Unable to load export history</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-3 font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {loading && !result && (
        <div className="space-y-3" aria-label="Loading exports">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-[#e7e5db] bg-[#fffefa] p-5"
            >
              <div className="h-4 w-1/3 rounded bg-[#efeee6]" />
              <div className="mt-3 h-3 w-1/2 rounded bg-[#f2f1eb]" />
            </div>
          ))}
        </div>
      )}

      {/* Export table */}
      {result && exports.length === 0 && !error && <EmptyState />}

      {exports.length > 0 && (
        <section
          className={`overflow-hidden rounded-2xl border border-[#e7e5db] bg-[#fffefa] transition-opacity ${
            loading ? 'opacity-60' : ''
          }`}
        >
          <div className="flex flex-col gap-1 border-b border-[#e9e7de] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold text-[#343a32]">Generated PDFs</h2>
              <p className="mt-1 text-xs text-[#898b80]">
                Manage and download your documents.
              </p>
            </div>

            {hasActive && (
              <span className="mt-2 inline-flex items-center gap-2 text-xs text-[#94723c] sm:mt-0">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#c2a66d]" />
                Updating export status...
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-[#f5f4ed] text-[#74776b]">
                <tr>
                  <th className="px-5 py-3.5 font-semibold sm:px-6">Form</th>
                  <th className="px-5 py-3.5 font-semibold">Export type</th>
                  <th className="whitespace-nowrap px-5 py-3.5 font-semibold">
                    Created
                  </th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold sm:px-6">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#eeece3]">
                {exports.map((exp) => (
                  <tr
                    key={exp.id}
                    className="transition hover:bg-[#faf9f4]"
                  >
                    <td className="max-w-64 px-5 py-4 sm:px-6">
                      <Link
                        to={`/forms/${exp.google_form_id}`}
                        className="font-medium leading-5 text-[#465b46] hover:text-[#30372f] hover:underline"
                      >
                        {exp.form_title || 'Untitled form'}
                      </Link>
                      {exp.filename && (
                        <p className="mt-1 truncate text-xs text-[#999a90]">
                          {exp.filename}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-[#454b42]">
                        {typeLabels[exp.type] || exp.type}
                      </p>
                      <p className="mt-1 text-xs text-[#898b80]">
                        {describeOptions(exp) || 'Default settings'}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-[#74776b]">
                      {new Date(exp.created_at).toLocaleString()}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={exp.status} />

                      {exp.status === 'failed' && exp.error_message && (
                        <p
                          title={exp.error_message}
                          className="mt-2 max-w-48 text-xs leading-5 text-[#a45142]"
                        >
                          {exp.error_message}
                        </p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right sm:px-6">
                      {exp.status === 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleDownload(exp)}
                          disabled={busyId === exp.id}
                          className="mr-2 inline-flex items-center gap-1.5 rounded-lg border border-[#dfe5d9] bg-[#f3f6ef] px-3 py-2 text-xs font-medium text-[#4e674d] transition hover:bg-[#e8eee2] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <DownloadIcon />
                          {busyId === exp.id ? 'Working...' : 'Download'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(exp)}
                        disabled={busyId === exp.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#eadbd5] px-3 py-2 text-xs font-medium text-[#a45142] transition hover:bg-[#fcf0ec] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <TrashIcon />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Pagination */}
      {result && result.last_page > 1 && (
        <div className="flex flex-col gap-4 rounded-2xl border border-[#e7e5db] bg-[#fffefa] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-[#85877d]">
            Page <span className="font-semibold text-[#454b42]">{result.current_page}</span>{' '}
            of <span className="font-semibold text-[#454b42]">{result.last_page}</span>
            <span className="mx-2 text-[#d1d0c5]">·</span>
            {result.total} total exports
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => current - 1)}
              disabled={page <= 1 || loading}
              className="rounded-xl border border-[#e3e2d8] px-4 py-2 text-sm font-medium text-[#656b60] transition hover:bg-[#f5f4ed] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= result.last_page || loading}
              className="rounded-xl border border-[#d9e1d3] bg-[#edf1e8] px-4 py-2 text-sm font-medium text-[#536b56] transition hover:bg-[#e3eadc] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
