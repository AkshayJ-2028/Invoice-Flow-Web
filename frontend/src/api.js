// All communication with the Spring Boot backend lives here.
// In development Vite forwards /api to localhost:8080 (see vite.config.js).
// After deployment, set VITE_API_URL to the address of your backend.
const BASE = import.meta.env.VITE_API_URL || ''

const read = k => {
  try { return localStorage.getItem(k) } catch { return null }
}
const write = (k, v) => {
  try { localStorage.setItem(k, v) } catch { /* ignore */ }
}
const remove = k => {
  try { localStorage.removeItem(k) } catch { /* ignore */ }
}

export const getToken = () => read('token')
export const getName = () => read('who')
export const setSession = (token, name) => {
  write('token', token)
  write('who', name)
}
export const clearSession = () => {
  remove('token')
  remove('who')
}

let onUnauthorized = () => {}
export const setUnauthorizedHandler = fn => {
  onUnauthorized = fn
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  // A wrong or expired token is answered with 403 by the backend.
  if (res.status === 403 && token && !path.startsWith('/api/auth')) {
    onUnauthorized()
    throw new Error('Session expired. Please login again.')
  }

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    /* not JSON */
  }
  if (!res.ok) {
    throw new Error((data && data.message) || `Request failed (${res.status}). Please check your input.`)
  }
  return data
}

export async function downloadPdf(invoice) {
  const res = await fetch(`${BASE}/api/invoices/${invoice.id}/pdf`, {
    headers: { Authorization: 'Bearer ' + getToken() }
  })
  if (!res.ok) throw new Error('Could not download PDF')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = invoice.invoiceNumber + '.pdf'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
