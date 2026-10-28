import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../api/axios'
import { getErrorMessage } from '../utils/errors'

const typeLabels = {
  text: 'Short answer',
  paragraph: 'Paragraph',
  radio: 'Multiple choice',
  checkbox: 'Checkboxes',
  dropdown: 'Dropdown',
  scale: 'Linear scale',
  date: 'Date',
  time: 'Time',
  file: 'File upload',
  grid: 'Grid',
}

const shorten = (text, max = 24) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

const tooltipFormatter = (value, _name, item) => [`${value} (${item.payload.percent}%)`, 'Responses']

// Horizontal bars: best for choice questions with long labels
function ChoiceChart({ options }) {
  const height = Math.max(140, options.length * 36 + 30)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={options} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={150}
          tickFormatter={(value) => shorten(String(value))}
        />
        <Tooltip formatter={tooltipFormatter} />
        <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Vertical columns: best for 1-5 / 1-10 scales
function ScaleChart({ options }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={options} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" />
        <YAxis allowDecimals={false} />
        <Tooltip formatter={tooltipFormatter} />
        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow px-5 py-4">
      <div className="text-2xl font-bold text-indigo-600">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500 mt-1">{label}</div>
    </div>
  )
}

export default function SummaryCharts({ formId }) {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    api
      .get(`/forms/${formId}/summary`)
      .then((res) => !cancelled && setSummary(res.data))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))

    return () => {
      cancelled = true
    }
  }, [formId])

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
        {error}
      </div>
    )
  }

  if (!summary) {
    return <p className="text-slate-500">Calculating summary...</p>
  }

  if (summary.response_count === 0) {
    return <p className="text-slate-600">This form has no responses yet, so there is nothing to summarize.</p>
  }

  const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '-')

  return (
    <div className="space-y-6">
      {summary.truncated && (
        <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3">
          This summary is based on the first {summary.response_count} responses.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Responses" value={summary.response_count} />
        <Stat label="Questions" value={summary.questions.length} />
        <Stat label="First response" value={formatDate(summary.first_submitted_at)} />
        <Stat label="Latest response" value={formatDate(summary.last_submitted_at)} />
      </div>

      {summary.questions.map((q, index) => (
        <div key={q.id} className="bg-white rounded-xl shadow p-5">
          <h4 className="font-medium text-slate-800">
            {index + 1}. {q.title || '(Untitled question)'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {typeLabels[q.type] || q.type} &middot; {q.answered} of {summary.response_count} answered
          </p>

          {q.chart === 'bar' && <ChoiceChart options={q.options} />}

          {q.chart === 'scale' && (
            <>
              {q.average !== null && (
                <p className="text-sm font-medium text-indigo-700 mb-2">Average: {q.average}</p>
              )}
              <ScaleChart options={q.options} />
            </>
          )}

          {q.chart === 'samples' &&
            (q.samples.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No answers yet.</p>
            ) : (
              <div>
                <p className="text-xs text-slate-500 mb-2">Latest answers</p>
                <ul className="space-y-2">
                  {q.samples.map((sample, i) => (
                    <li key={i} className="border-l-4 border-indigo-200 pl-3 text-sm text-slate-700">
                      {sample}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          {q.chart === 'none' && (
            <p className="text-sm text-slate-400 italic">No chart for this question type.</p>
          )}
        </div>
      ))}
    </div>
  )
}