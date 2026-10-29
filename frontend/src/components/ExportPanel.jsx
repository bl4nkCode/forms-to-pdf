import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { downloadExport } from '../utils/download'
import { getErrorMessage } from '../utils/errors'
import { waitForExport } from '../utils/exports'

export default function ExportPanel({ formId, responseCount }) {
  const [type, setType] = useState('blank')
  const [paper, setPaper] = useState('a4')
  const [answerLines, setAnswerLines] = useState(true)
  const [layout, setLayout] = useState('table')
  const [textSamples, setTextSamples] = useState(true)
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Stop polling if the user leaves the page
  const stopped = useRef(false)
  useEffect(() => {
    stopped.current = false
    return () => {
      stopped.current = true
    }
  }, [])

  const hasResponses = responseCount !== null && responseCount > 0

  const noResponsesHint =
    responseCount === null ? 'Loading responses...' : 'This form has no responses yet'

  const exportTypes = [
    { value: 'blank', label: 'Blank form', hint: 'A printable copy of the questions', enabled: true },
    {
      value: 'responses',
      label: 'Responses',
      hint: hasResponses
        ? `${responseCount} response${responseCount === 1 ? '' : 's'}, as a table or one per page`
        : noResponsesHint,
      enabled: hasResponses,
    },
    {
      value: 'summary',
      label: 'Summary with charts',
      hint: hasResponses ? 'Totals and bar charts for every question' : noResponsesHint,
      enabled: hasResponses,
    },
  ]

  const handleExport = async () => {
    setBusy(true)
    setStage('Queued...')
    setError('')
    setDone(false)

    const options = { paper }
    if (type === 'blank') options.answer_lines = answerLines
    if (type === 'responses') options.layout = layout
    if (type === 'summary') options.text_samples = textSamples

    try {
      const res = await api.post('/exports', { form_id: formId, type, options })

      const finished = await waitForExport(res.data.id, {
        isCancelled: () => stopped.current,
        onUpdate: (exp, elapsedMs) => {
          if (exp.status === 'processing') setStage('Generating PDF...')
          else if (elapsedMs > 20000) setStage('Still queued... this is taking longer than usual')
          else setStage('Queued...')
        },
      })

      if (!finished) return // user left the page

      if (finished.status === 'failed') {
        setError(finished.error_message || 'The export failed. Please try again.')
        return
      }

      await downloadExport(finished)
      setDone(true)
    } catch (err) {
      setError(
        err.timedOut
          ? 'The export is taking longer than expected. It will appear in your export history when it finishes.'
          : getErrorMessage(err)
      )
    } finally {
      if (!stopped.current) {
        setBusy(false)
        setStage('')
      }
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Export to PDF</h3>

      <div className="space-y-2 mb-5">
        {exportTypes.map((t) => (
          <label
            key={t.value}
            className={`flex items-start gap-3 rounded-md border px-3 py-2 ${
              t.enabled ? 'cursor-pointer border-slate-300' : 'border-slate-200 opacity-50'
            }`}
          >
            <input
              type="radio"
              name="export-type"
              value={t.value}
              checked={type === t.value}
              disabled={!t.enabled || busy}
              onChange={() => setType(t.value)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">{t.label}</span>
              <span className="block text-xs text-slate-500">{t.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-6 mb-5">
        <label className="text-sm text-slate-700">
          Paper size{' '}
          <select
            value={paper}
            disabled={busy}
            onChange={(e) => setPaper(e.target.value)}
            className="ml-2 rounded-md border border-slate-300 px-2 py-1"
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
        </label>

        {type === 'blank' && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={answerLines}
              disabled={busy}
              onChange={(e) => setAnswerLines(e.target.checked)}
            />
            Include answer lines
          </label>
        )}

        {type === 'responses' && (
          <label className="text-sm text-slate-700">
            Layout{' '}
            <select
              value={layout}
              disabled={busy}
              onChange={(e) => setLayout(e.target.value)}
              className="ml-2 rounded-md border border-slate-300 px-2 py-1"
            >
              <option value="table">Table (landscape)</option>
              <option value="per_page">One response per page</option>
            </select>
          </label>
        )}

        {type === 'summary' && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={textSamples}
              disabled={busy}
              onChange={(e) => setTextSamples(e.target.checked)}
            />
            Include sample text answers
          </label>
        )}
      </div>

      {type === 'responses' && (
        <p className="text-xs text-slate-500 -mt-2 mb-5">
          Large forms are limited to the first 500 responses (table) or 200 (one per page).
        </p>
      )}
      {type === 'summary' && (
        <p className="text-xs text-slate-500 -mt-2 mb-5">
          Summaries use up to the first 1,000 responses. Untick the box if your text answers may
          contain personal information.
        </p>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-4">
          {error}{' '}
          <Link to="/exports" className="underline font-medium">
            View export history
          </Link>
        </div>
      )}
      {done && (
        <div className="rounded-md bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 mb-4">
          Your PDF has been downloaded. You can download it again from{' '}
          <Link to="/exports" className="underline font-medium">
            Export history
          </Link>
          .
        </div>
      )}

      <button
        onClick={handleExport}
        disabled={busy}
        className="rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
      >
        {busy ? stage || 'Working...' : 'Generate & download PDF'}
      </button>
    </div>
  )
}