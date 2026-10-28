import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

const MAX_ROWS_SHOWN = 100

function QuestionCard({ item }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-start justify-between gap-4">
        <h4 className="font-medium text-slate-800">
          {item.title || '(Untitled question)'}
          {item.required && <span className="text-red-500 ml-1">*</span>}
        </h4>
        <span className="shrink-0 text-xs rounded-full bg-slate-100 text-slate-600 px-2 py-1">
          {typeLabels[item.type] || item.type}
        </span>
      </div>

      {item.description && <p className="text-sm text-slate-500 mt-1">{item.description}</p>}

      {item.options?.length > 0 && (
        <ul className="mt-3 list-disc list-inside text-sm text-slate-600 space-y-0.5">
          {item.options.map((option, i) => (
            <li key={i}>{option}</li>
          ))}
        </ul>
      )}

      {item.type === 'scale' && item.scale && (
        <p className="mt-3 text-sm text-slate-600">
          {item.scale.low}
          {item.scale.low_label ? ` (${item.scale.low_label})` : ''} to {item.scale.high}
          {item.scale.high_label ? ` (${item.scale.high_label})` : ''}
        </p>
      )}
    </div>
  )
}

export default function FormDetail() {
  const { id } = useParams()
  const [form, setForm] = useState(null)
  const [formError, setFormError] = useState('')
  const [responses, setResponses] = useState(null)
  const [responsesError, setResponsesError] = useState('')
  const [tab, setTab] = useState('questions')

  useEffect(() => {
    api
      .get(`/forms/${id}`)
      .then((res) => setForm(res.data))
      .catch((err) => setFormError(getErrorMessage(err)))

    api
      .get(`/forms/${id}/responses`)
      .then((res) => setResponses(res.data))
      .catch((err) => setResponsesError(getErrorMessage(err)))
  }, [id])

  const questions = useMemo(
    () => (form ? form.items.filter((item) => item.kind === 'question') : []),
    [form]
  )

  if (formError) {
    return (
      <div>
        <Link to="/forms" className="text-sm text-indigo-600 hover:underline">
          &larr; Back to forms
        </Link>
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {formError}
        </div>
      </div>
    )
  }

  if (!form) {
    return <p className="text-slate-500">Loading form...</p>
  }

  const tabClass = (name) =>
    `px-4 py-2 text-sm font-medium border-b-2 ${
      tab === name
        ? 'border-indigo-600 text-indigo-700'
        : 'border-transparent text-slate-500 hover:text-slate-700'
    }`

  return (
    <div>
      <Link to="/forms" className="text-sm text-indigo-600 hover:underline">
        &larr; Back to forms
      </Link>

      <h2 className="text-2xl font-semibold text-slate-800 mt-3">{form.title}</h2>
      {form.description && <p className="text-slate-600 mt-1">{form.description}</p>}

      <div className="flex border-b border-slate-200 mt-6 mb-6">
        <button className={tabClass('questions')} onClick={() => setTab('questions')}>
          Questions ({questions.length})
        </button>
        <button className={tabClass('responses')} onClick={() => setTab('responses')}>
          Responses {responses ? `(${responses.count}${responses.truncated ? '+' : ''})` : ''}
        </button>
      </div>

      {tab === 'questions' && (
        <div className="space-y-4">
          {form.items.map((item, i) => {
            if (item.kind === 'section') {
              return (
                <h3 key={i} className="text-lg font-semibold text-slate-700 pt-4">
                  {item.title || 'New section'}
                </h3>
              )
            }
            if (item.kind === 'text') {
              return (
                <div key={i} className="text-sm text-slate-600 px-1">
                  {item.title && <p className="font-medium">{item.title}</p>}
                  {item.description && <p>{item.description}</p>}
                </div>
              )
            }
            return <QuestionCard key={item.id} item={item} />
          })}
          {form.items.length === 0 && <p className="text-slate-500">This form has no questions.</p>}
        </div>
      )}

      {tab === 'responses' && (
        <div>
          {responsesError && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {responsesError}
            </div>
          )}

          {!responsesError && !responses && <p className="text-slate-500">Loading responses...</p>}

          {responses && responses.count === 0 && (
            <p className="text-slate-600">This form has no responses yet.</p>
          )}

          {responses && responses.count > 0 && (
            <>
              <p className="text-sm text-slate-500 mb-3">
                {responses.truncated
                  ? `Showing the first ${responses.count} responses.`
                  : `${responses.count} response${responses.count === 1 ? '' : 's'}.`}
                {responses.count > MAX_ROWS_SHOWN && ` The table shows the first ${MAX_ROWS_SHOWN}.`}
              </p>

              <div className="bg-white rounded-xl shadow overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Submitted</th>
                      {questions.map((q) => (
                        <th key={q.id} className="px-4 py-3 font-medium min-w-40">
                          {q.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {responses.responses.slice(0, MAX_ROWS_SHOWN).map((r, i) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : ''}
                        </td>
                        {questions.map((q) => (
                          <td key={q.id} className="px-4 py-3 text-slate-700">
                            {(r.answers[q.id] || []).join(', ')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}