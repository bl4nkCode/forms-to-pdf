export function getErrorMessage(err) {
  const data = err.response?.data
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }
  return data?.message || 'Something went wrong. Please try again.'
}