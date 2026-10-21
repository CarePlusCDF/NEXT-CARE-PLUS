export const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '')).replace(/\/$/, '')

export async function apiFetch(url, options = {}) {
  if (!API_URL && import.meta.env.PROD) throw new Error('Configure VITE_API_URL na publicação do site.')
  const headers = new Headers(options.headers)
  const token = localStorage.getItem('token')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  let body = options.body
  if (body && typeof body === 'string' && headers.get('Content-Type') === 'application/json') {
    const data = JSON.parse(body)
    if (!('generation' in data)) data.generation = localStorage.getItem('generation') || ''
    body = JSON.stringify(data)
  }
  const timeout = AbortSignal.timeout(12000)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
  const response = await fetch(url, { ...options, body, headers, signal })
  if (response.status === 401 && token && !url.endsWith('/login')) {
    localStorage.removeItem('token')
    window.dispatchEvent(new Event('sessaoAlterada'))
    window.location.assign('/login')
  }
  return response
}

export async function post(path, data = {}) {
  const r = await apiFetch(`${API_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  const result = await r.json()
  if (!r.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Revise os dados informados.')
  window.dispatchEvent(new Event('estadoAlterado'))
  return result
}
