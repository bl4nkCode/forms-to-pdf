
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axios'
import ExportPanel from '../components/ExportPanel'
import SummaryCharts from '../components/SummaryCharts'
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

function QuestionCard({ item, index }) {
  return (
    <article className="rounded-2xl border border-[#e7e5db] bg-[#fffefa] p-5 transition hover:border-[#d5ddcf] sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf1e8] text-sm font-semibold text-[#61775d]">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-sm font-semibold leading-6 text-[#343a32] sm:text-base">
              {item.title || '(Untitled question)'}
              {item.required && (
                <span className="ml-1 text-[#b85d4d]" aria-label="Required">
                  *
                </span>
              )}
            </h3>

            <span className="w-fit shrink-0 rounded-lg border border-[#e6e5da] bg-[#f8f7f2] px-2.5 py-1 text-[11px] font-medium text-[#74776b]">
              {typeLabels[item.type] || item.type}
            </span>
          </div>

          {item.description && (
            <p className="mt-2 text-sm leading-6 text-[#85877d]">
              {item.description}
            </p>
          )}

          {item.options?.length > 0 && (
            <ul className="mt-4 space-y-2">
              {item.options.map((option, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm leading-5 text-[#656b60]"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-[#a8b7a0]" />
                  {option}
                </li>
              ))}
            </ul>
          )}

          {item.type === 'scale' && item.scale && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#656b60]">
              <span className="rounded-lg bg-[#f1f3ec] px-3 py-2">
                {item.scale.low}
                {item.scale.low_label ? ` · ${item.scale.low_label}` : ''}
              </span>
              <span className="text-[#a1a296]">to</span>
              <span className="rounded-lg bg-[#f1f3ec] px-3 py-2">
                {item.scale.high}
                {item.scale.high_label ? ` · ${item.scale.high_label}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#dcdccf] bg-[#fffefa] px-5 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf1e8] text-[#657b60]">
        <DocumentIcon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#343a32]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#85877d]">
        {description}
      </p>
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
    setForm(null)
    setFormError('')
    setResponses(null)
    setResponsesError('')

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
    [form],
  )

  if (formError) {
    return (
      <div className="space-y-5">
        <Link
          to="/forms"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#536b56] hover:text-[#354b38]"
        >
          <span aria-hidden="true">←</span>
          Back to forms
        </Link>

        <div
          role="alert"
          className="rounded-2xl border border-[#edd4cc] bg-[#fcf1ed] px-5 py-4 text-sm text-[#9b4d3d]"
        >
          <p className="font-semibold">Unable to open this form</p>
          <p className="mt-1">{formError}</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="space-y-5">
        <div className="h-4 w-24 animate-pulse rounded bg-[#e9e7de]" />
        <div className="rounded-3xl border border-[#e7e5db] bg-[#fffefa] p-6 sm:p-8">
          <div className="h-7 w-3/5 animate-pulse rounded bg-[#efeee6]" />
          <div className="mt-4 h-4 w-2/5 animate-pulse rounded bg-[#f2f1eb]" />
          <div className="mt-8 h-28 animate-pulse rounded-2xl bg-[#f2f1eb]" />
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'questions', label: 'Questions', count: questions.length },
    {
      id: 'responses',
      label: 'Responses',
      count: responses
        ? `${responses.count}${responses.truncated ? '+' : ''}`
        : null,
    },
    { id: 'summary', label: 'Summary', count: null },
  ]

  const tabClass = (name) =>
    [
      'inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition',
      tab === name
        ? 'border-[#536b56] text-[#435846]'
        : 'border-transparent text-[#85877d] hover:text-[#4d5549]',
    ].join(' ')

  return (
    <div className="space-y-7 sm:space-y-8">
      {/* Breadcrumb */}
      <Link
        to="/forms"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#687b62] transition hover:text-[#354b38]"
      >
        <span aria-hidden="true">←</span>
        All forms
      </Link>

      {/* Form heading */}
      <section className="rounded-3xl border border-[#e6e5da] bg-[#fffefa] p-5 sm:p-7 lg:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8eee3] text-[#536b56] sm:h-14 sm:w-14">
            <DocumentIcon className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a8d80]">
              Form details
            </p>
            <h1 className="mt-2 break-words text-2xl font-semibold leading-tight tracking-tight text-[#30372f] sm:text-3xl">
              {form.title || 'Untitled form'}
            </h1>

            {form.description && (
              <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-[#85877d]">
                {form.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe6d9] bg-[#f0f4ec] px-3 py-1.5 text-xs font-medium text-[#536b56]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#789171]" />
                Google Form
              </span>

              <span className="rounded-full border border-[#e7e5db] bg-[#f8f7f2] px-3 py-1.5 text-xs text-[#74776b]">
                {questions.length} question{questions.length === 1 ? '' : 's'}
              </span>

              {responses && (
                <span className="rounded-full border border-[#e7e5db] bg-[#f8f7f2] px-3 py-1.5 text-xs text-[#74776b]">
                  {responses.count} response{responses.count === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PDF export options */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-[#343a32]">
            Export document
          </h2>
          <p className="mt-1 text-sm text-[#898b80]">
            Choose your PDF format and customize the export options.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e7e5db] bg-[#fffefa] p-4 sm:p-6">
          <ExportPanel
            formId={form.id}
            responseCount={responses ? responses.count : null}
          />
        </div>
      </section>

      {/* Form tabs */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-[#343a32]">
            Explore your form
          </h2>
          <p className="mt-1 text-sm text-[#898b80]">
            Review the questions, submitted responses, or response summary.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e7e5db] bg-[#fffefa]">
          <div className="overflow-x-auto border-b border-[#e9e7de] px-2">
            <div className="flex min-w-max">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={tabClass(item.id)}
                  onClick={() => setTab(item.id)}
                  aria-current={tab === item.id ? 'page' : undefined}
                >
                  {item.label}
                  {item.count !== null && (
                    <span
                      className={[
                        'rounded-md px-1.5 py-0.5 text-xs',
                        tab === item.id
                          ? 'bg-[#e8eee3] text-[#536b56]'
                          : 'bg-[#f1f0e9] text-[#85877d]',
                      ].join(' ')}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {tab === 'questions' && (
              <div className="space-y-4">
                {form.items.map((item, i) => {
                  if (item.kind === 'section') {
                    return (
                      <div
                        key={i}
                        className="border-b border-[#e8e6dc] pb-3 pt-4 first:pt-0"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#899080]">
                          Section
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-[#465343]">
                          {item.title || 'New section'}
                        </h3>
                      </div>
                    )
                  }

                  if (item.kind === 'text') {
                    return (
                      <div
                        key={i}
                        className="rounded-xl bg-[#f8f7f2] px-4 py-3"
                      >
                        {item.title && (
                          <p className="text-sm font-medium text-[#454b42]">
                            {item.title}
                          </p>
                        )}
                        {item.description && (
                          <p className="mt-1 text-sm leading-6 text-[#85877d]">
                            {item.description}
                          </p>
                        )}
                      </div>
                    )
                  }

                  return (
                    <QuestionCard
                      key={item.id || i}
                      item={item}
                      index={questions.findIndex((question) => question === item)}
                    />
                  )
                })}

                {form.items.length === 0 && (
                  <EmptyState
                    title="No questions yet"
                    description="This form doesn't contain any questions to display."
                  />
                )}
              </div>
            )}

            {tab === 'responses' && (
              <div>
                {responsesError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-[#edd4cc] bg-[#fcf1ed] px-4 py-3 text-sm text-[#9b4d3d]"
                  >
                    {responsesError}
                  </div>
                )}

                {!responsesError && !responses && (
                  <div className="flex items-center gap-3 py-6 text-sm text-[#85877d]">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d9dfd2] border-t-[#536b56]" />
                    Loading responses...
                  </div>
                )}

                {responses && responses.count === 0 && (
                  <EmptyState
                    title="No responses yet"
                    description="When people submit this Google Form, their responses will appear here."
                  />
                )}

                {responses && responses.count > 0 && (
                  <>
                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-[#656b60]">
                        {responses.truncated
                          ? `Showing the first ${responses.count} responses.`
                          : `${responses.count} response${responses.count === 1 ? '' : 's'} received.`}
                      </p>

                      {responses.count > MAX_ROWS_SHOWN && (
                        <p className="text-xs text-[#999a90]">
                          Displaying the first {MAX_ROWS_SHOWN} rows
                        </p>
                      )}
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#e7e5db]">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-[#f3f3eb] text-[#646b5e]">
                          <tr>
                            <th className="whitespace-nowrap px-4 py-3 font-semibold">
                              #
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 font-semibold">
                              Submitted
                            </th>
                            {questions.map((q) => (
                              <th
                                key={q.id}
                                className="min-w-40 px-4 py-3 font-semibold"
                              >
                                {q.title || 'Untitled question'}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-[#eeece3]">
                          {responses.responses
                            .slice(0, MAX_ROWS_SHOWN)
                            .map((r, i) => (
                              <tr
                                key={r.id}
                                className="transition hover:bg-[#faf9f4]"
                              >
                                <td className="px-4 py-3 text-[#999a90]">
                                  {i + 1}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-[#656b60]">
                                  {r.submitted_at
                                    ? new Date(r.submitted_at).toLocaleString()
                                    : '—'}
                                </td>

                                {questions.map((q) => (
                                  <td
                                    key={q.id}
                                    className="px-4 py-3 text-[#454b42]"
                                  >
                                    {(r.answers[q.id] || []).join(', ') || '—'}
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

            {tab === 'summary' && <SummaryCharts formId={form.id} />}
          </div>
        </div>
      </section>
    </div>
  )
}
