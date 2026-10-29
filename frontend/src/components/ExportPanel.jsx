
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { downloadExport } from '../utils/download'
import { getErrorMessage } from '../utils/errors'
import { waitForExport } from '../utils/exports'

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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

function RadioCard({ option, selected, disabled, onChange }) {
  return (
    <label
      className={[
        'relative flex gap-3 rounded-2xl border p-4 transition',
        disabled
          ? 'cursor-not-allowed border-[#e9e7de] bg-[#f8f7f2] opacity-55'
          : 'cursor-pointer',
        selected
          ? 'border-[#81947a] bg-[#f0f4ec] ring-1 ring-[#81947a]'
          : 'border-[#e7e5db] bg-[#fffefa] hover:border-[#cbd5c3] hover:bg-[#fcfbf7]',
      ].join(' ')}
    >
      <input
        type="radio"
        name="export-type"
        value={option.value}
        checked={selected}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
      />

      <span
        className={[
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
          selected
            ? 'border-[#536b56] bg-[#536b56] text-white'
            : 'border-[#c9cbbf] bg-white',
        ].join(' ')}
      >
        {selected && (
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#343a32]">
          {option.label}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#85877d]">
          {option.hint}
        </span>
      </span>

      {selected && (
        <span className="absolute right-3 top-3 text-[#536b56]">
          <CheckIcon />
        </span>
      )}
    </label>
  )
}

function SettingLabel({ children }) {
  return (
    <span className="mb-2 block text-xs font-semibold text-[#656b60]">
      {children}
    </span>
  )
}

const selectClass =
  'w-full rounded-xl border border-[#deded2] bg-[#fffefa] px-3 py-2.5 text-sm text-[#454b42] outline-none transition focus:border-[#81947a] focus:ring-2 focus:ring-[#dfe7d9] disabled:cursor-not-allowed disabled:bg-[#f5f4ed]'

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

  const stopped = useRef(false)

  useEffect(() => {
    stopped.current = false

    return () => {
      stopped.current = true
    }
  }, [])

  const hasResponses = responseCount !== null && responseCount > 0

  const noResponsesHint =
    responseCount === null
      ? 'Checking available responses...'
      : 'No responses are available for this form yet.'

  const exportTypes = [
    {
      value: 'blank',
      label: 'Blank form',
      hint: 'A printable questionnaire with optional answer lines.',
      enabled: true,
    },
    {
      value: 'responses',
      label: 'Responses',
      hint: hasResponses
        ? `${responseCount} response${responseCount === 1 ? '' : 's'} ready to export.`
        : noResponsesHint,
      enabled: hasResponses,
    },
    {
      value: 'summary',
      label: 'Summary with charts',
      hint: hasResponses
        ? 'Response totals, charts, and optional text samples.'
        : noResponsesHint,
      enabled: hasResponses,
    },
  ]

  const handleExport = async () => {
    setBusy(true)
    setStage('Queuing your export...')
    setError('')
    setDone(false)

    const options = { paper }

    if (type === 'blank') options.answer_lines = answerLines
    if (type === 'responses') options.layout = layout
    if (type === 'summary') options.text_samples = textSamples

    try {
      const res = await api.post('/exports', {
        form_id: formId,
        type,
        options,
      })

      const finished = await waitForExport(res.data.id, {
        isCancelled: () => stopped.current,
        onUpdate: (exp, elapsedMs) => {
          if (exp.status === 'processing') {
            setStage('Generating your PDF...')
          } else if (elapsedMs > 20000) {
            setStage('Still waiting for the export...')
          } else {
            setStage('Waiting in the export queue...')
          }
        },
      })

      if (!finished) return

      if (finished.status === 'failed') {
        setError(
          finished.error_message || 'The export failed. Please try again.',
        )
        return
      }

      await downloadExport(finished)
      setDone(true)
    } catch (err) {
      setError(
        err.timedOut
          ? 'This export is taking longer than expected. Check Export history to download it when it finishes.'
          : getErrorMessage(err),
      )
    } finally {
      if (!stopped.current) {
        setBusy(false)
        setStage('')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Panel heading */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9efe4] text-[#536b56]">
          <FileIcon />
        </div>

        <div>
          <h3 className="text-base font-semibold text-[#343a32]">
            Export to PDF
          </h3>
          <p className="mt-1 text-sm leading-5 text-[#85877d]">
            Choose what to include in your document and customize its layout.
          </p>
        </div>
      </div>

      {/* Export type */}
      <fieldset disabled={busy} className="space-y-3">
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#85877d]">
          01 — Choose export type
        </legend>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {exportTypes.map((option) => (
            <RadioCard
              key={option.value}
              option={option}
              selected={type === option.value}
              disabled={!option.enabled || busy}
              onChange={() => setType(option.value)}
            />
          ))}
        </div>
      </fieldset>

      {/* PDF settings */}
      <fieldset
        disabled={busy}
        className="rounded-2xl border border-[#e7e5db] bg-[#f8f7f2] p-4 sm:p-5"
      >
        <legend className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#85877d]">
          02 — Document settings
        </legend>

        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <SettingLabel>Paper size</SettingLabel>
            <select
              value={paper}
              onChange={(e) => setPaper(e.target.value)}
              className={selectClass}
            >
              <option value="a4">A4 — Standard international</option>
              <option value="letter">Letter — US standard</option>
            </select>
          </div>

          {type === 'responses' && (
            <div>
              <SettingLabel>Response layout</SettingLabel>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
                className={selectClass}
              >
                <option value="table">Table — Landscape</option>
                <option value="per_page">One response per page</option>
              </select>
            </div>
          )}
        </div>

        {type === 'blank' && (
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#e5e4d9] bg-[#fffefa] p-3.5">
            <input
              type="checkbox"
              checked={answerLines}
              onChange={(e) => setAnswerLines(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#536b56]"
            />
            <span>
              <span className="block text-sm font-medium text-[#454b42]">
                Include answer lines
              </span>
              <span className="mt-1 block text-xs leading-5 text-[#85877d]">
                Add writing space beneath questions on the printed form.
              </span>
            </span>
          </label>
        )}

        {type === 'summary' && (
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#e5e4d9] bg-[#fffefa] p-3.5">
            <input
              type="checkbox"
              checked={textSamples}
              onChange={(e) => setTextSamples(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#536b56]"
            />
            <span>
              <span className="block text-sm font-medium text-[#454b42]">
                Include sample text answers
              </span>
              <span className="mt-1 block text-xs leading-5 text-[#85877d]">
                Include example written responses in the summary. Disable this
                if text answers may contain personal information.
              </span>
            </span>
          </label>
        )}
      </fieldset>

      {/* Export limits */}
      {type === 'responses' && (
        <div className="flex items-start gap-3 rounded-xl border border-[#e7e5db] bg-[#fffefa] px-4 py-3">
          <span className="mt-0.5 text-[#819078]" aria-hidden="true">ⓘ</span>
          <p className="text-xs leading-5 text-[#74776b]">
            Large forms are limited to the first 500 responses in table layout,
            or 200 responses when exporting one response per page.
          </p>
        </div>
      )}

      {type === 'summary' && (
        <div className="flex items-start gap-3 rounded-xl border border-[#e7e5db] bg-[#fffefa] px-4 py-3">
          <span className="mt-0.5 text-[#819078]" aria-hidden="true">ⓘ</span>
          <p className="text-xs leading-5 text-[#74776b]">
            Summaries use up to the first 1,000 responses. You can disable
            sample text answers to reduce the amount of potentially sensitive
            information in the PDF.
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-[#efd7d0] bg-[#fcf0ec] px-4 py-3 text-sm text-[#a45142]"
        >
          <p className="font-semibold">Couldn't generate the PDF</p>
          <p className="mt-1 leading-5">{error}</p>
          <Link
            to="/exports"
            className="mt-2 inline-block font-semibold underline underline-offset-2"
          >
            View export history
          </Link>
        </div>
      )}

      {/* Success message */}
      {done && (
        <div
          role="status"
          className="rounded-xl border border-[#dce7d6] bg-[#edf4e9] px-4 py-3 text-sm text-[#4e6c4b]"
        >
          <div className="flex items-center gap-2 font-semibold">
            <CheckIcon />
            Your PDF has been downloaded.
          </div>
          <p className="mt-1 leading-5">
            You can download it again from{' '}
            <Link
              to="/exports"
              className="font-semibold underline underline-offset-2"
            >
              Export history
            </Link>
            .
          </p>
        </div>
      )}

      {/* Generate button */}
      <div className="flex flex-col gap-3 border-t border-[#e9e7de] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#454b42]">
            Ready to create your document?
          </p>
          <p className="mt-1 text-xs text-[#898b80]">
            Your selected settings will be applied to the PDF.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={busy}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#536b56] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#435846] focus:outline-none focus:ring-2 focus:ring-[#a9b9a1] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              {stage || 'Working...'}
            </>
          ) : (
            <>
              <FileIcon className="h-4 w-4" />
              Generate & download PDF
            </>
          )}
        </button>
      </div>
    </div>
  )
}
