// Compatibility module name retained for existing imports. Active transport is HTTPS.
import { apiFetch, API_URL } from './api.js'

export async function buscarMissoesConnect(_carteirinha, signal) {
  const r = await apiFetch(`${API_URL}/connect`, { signal })
  const data = await r.json()
  if (!r.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Não foi possível consultar os aparelhos.')
  if (signal?.aborted) throw new DOMException('Navegação encerrada', 'AbortError')
  return data
}
