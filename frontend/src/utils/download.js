import api from '../api/axios'

// Downloads an export's PDF through axios so the Bearer token is sent
export async function downloadExport(exportRecord) {
  let res

  try {
    res = await api.get(`/exports/${exportRecord.id}/download`, { responseType: 'blob' })
  } catch (err) {
    // Error bodies also arrive as blobs, so turn them back into JSON for getErrorMessage()
    if (err.response?.data instanceof Blob) {
      try {
        err.response.data = JSON.parse(await err.response.data.text())
      } catch {
        // leave as is
      }
    }
    throw err
  }

  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.download = exportRecord.filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}