import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { downloadExport } from '../utils/download'
import { getErrorMessage } from '../utils/errors'

const typeLabels = {
  blank: 'Blank form',
  responses: 'Responses',
  summary: 'Summary',
}

const paperLabels = { a4: 'A4', letter: 'Letter' }

const statusStyles = {
  completed: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  processing: 'bg-amber-50 text-amber-700',
  pending: 'bg-slate-100 text-slate-600',
}

// A short human-readable description of the options used for an export
function describeOptions(exportRecord) {
  const o = exportRecord.options || {}
  const parts = []

  if (o.paper) parts.push(paperLabels[o.paper] || o.paper)

  if (exportRecord.type === 'blank') {
    parts.push(o.answer_lines === false ? 'no answer lines' : 'with answer lines')
  } else if (exportRecord.type === 'responses') {
    parts.push(o.layout === 'per_page' ? 'one per page' : 'table')
  } else if (exportRecord.type === 'summary') {
    parts.push(o.text_samples === false ? 'no text samples' : 'with text samples')
  }

  return parts.join(', ')
}

export default function Exports() {
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    api
      .get('/exports', { params: { page } })
      .then((res) => {
        if (cancelled) return
        // If the last item on a page was deleted, step back one page
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
    if (!window.confirm(`Delete "${exportRecord.filename}" and its PDF file? This cannot be undone.`)) {
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
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 mb-6">Export history</h2>

      {notice && (
        <div
          className={`rounded-md border text-sm px-3 py-2 mb-4 ${
            notice.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {loading && !result && <p className="text-slate-500">Loading your exports...</p>}

      {result && exports.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-slate-600 mb-4">You haven't exported any PDFs yet.</p>
          <Link
            to="/forms"
            className="inline-block rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700"
          >
            Choose a form
          </Link>
        </div>
      )}

      {exports.length > 0 && (
        <div className={`bg-white rounded-xl shadow overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Form</th>
                <th className="px-4 py-3 font-medium">Export</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Created</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exports.map((exp) => (
                <tr key={exp.id}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/forms/${exp.google_form_id}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {exp.form_title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800">{typeLabels[exp.type] || exp.type}</div>
                    <div className="text-xs text-slate-500">{describeOptions(exp)}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {new Date(exp.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      title={exp.error_message || ''}
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        statusStyles[exp.status] || statusStyles.pending
                      }`}
                    >
                      {exp.status}
                    </span>
                    {exp.status === 'failed' && exp.error_message && (
                      <div className="text-xs text-red-600 mt-1 max-w-48">{exp.error_message}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {exp.status === 'completed' && (
                      <button
                        onClick={() => handleDownload(exp)}
                        disabled={busyId === exp.id}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-60 mr-2"
                      >
                        Download
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(exp)}
                      disabled={busyId === exp.id}
                      className="rounded-md border border-red-200 text-red-600 px-3 py-1.5 text-xs hover:bg-red-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>
            Page {result.current_page} of {result.last_page} &middot; {result.total} exports
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || loading}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= result.last_page || loading}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}