import api from '../api/axios'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Polls an export until it is completed or failed.
 * Returns the final export record, or null if isCancelled() became true.
 */
export async function waitForExport(
  id,
  { onUpdate, isCancelled, intervalMs = 1500, timeoutMs = 5 * 60 * 1000 } = {}
) {
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    if (isCancelled?.()) return null

    const res = await api.get(`/exports/${id}`)
    onUpdate?.(res.data, Date.now() - started)

    if (res.data.status === 'completed' || res.data.status === 'failed') {
      return res.data
    }

    await sleep(intervalMs)
  }

  const err = new Error('Export timed out')
  err.timedOut = true
  throw err
}