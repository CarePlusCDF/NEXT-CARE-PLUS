import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { buscarMissoesConnect } from './fiware.js'
import { usePolling } from './usePolling.js'
import { salvarSessaoUsuario } from './sessao.js'

const CareContext = createContext(null)

export function CareProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  useEffect(() => {
    const changed = () => {
      setToken(localStorage.getItem('token'))
      setData(null)
    }
    window.addEventListener('sessaoAlterada', changed)
    window.addEventListener('storage', changed)
    return () => {
      window.removeEventListener('sessaoAlterada', changed)
      window.removeEventListener('storage', changed)
    }
  }, [])
  const poll = useCallback(async signal => {
    if (!token) return
    try {
      const result = await buscarMissoesConnect(localStorage.getItem('carteirinha'), signal)
      if (signal?.aborted || localStorage.getItem('token') !== token) return
      salvarSessaoUsuario(result.usuario)
      setData(result)
      setError('')
      setUpdatedAt(new Date())
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message)
    }
  }, [token])
  usePolling(poll, 2500, Boolean(token))
  const refresh = useCallback(() => window.dispatchEvent(new Event('estadoAlterado')), [])
  return <CareContext.Provider value={{ data, error, updatedAt, refresh, loading: !data && !error }}>{children}</CareContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCare() { return useContext(CareContext) }
