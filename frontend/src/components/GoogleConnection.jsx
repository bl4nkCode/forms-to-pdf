import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { getErrorMessage } from '../utils/errors'

const messages = {
  connected: ['success', 'Google account connected.'],
  error: ['error', 'Google connection failed. Please try again.'],
  missing_scopes: [
    'error',
    'Please tick all the permission checkboxes on the Google screen, then try again.',
  ],
}

export default function GoogleConnection() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState({ connected: false, email: null })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    const result = searchParams.get('google')
    if (result && messages[result]) {
      const [type, text] = messages[result]
      setNotice({ type, text })
      setSearchParams({}, { replace: true }) // clean the URL
    }

    api
      .get('/google/status')
      .then((res) => setStatus(res.data))
      .catch((err) => setNotice({ type: 'error', text: getErrorMessage(err) }))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connect = async () => {
    setBusy(true)
    try {
      const res = await api.get('/auth/google/redirect')
      window.location.href = res.data.url
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) })
      setBusy(false)
    }
  }

  const disconnect = async () => {
    setBusy(true)
    try {
      await api.delete('/google')
      setStatus({ connected: false, email: null })
      setNotice({ type: 'success', text: 'Google account disconnected.' })
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-1">Google account</h3>

      {notice && (
        <div
          className={`rounded-md border text-sm px-3 py-2 my-3 ${
            notice.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500 text-sm">Checking connection...</p>
      ) : status.connected ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            Connected as <span className="font-medium">{status.email}</span>
          </p>
          <button
            onClick={disconnect}
            disabled={busy}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            Connect Google to read your forms (read-only access).
          </p>
          <button
            onClick={connect}
            disabled={busy}
            className="rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? 'Redirecting...' : 'Connect Google'}
          </button>
        </div>
      )}
    </div>
  )
}