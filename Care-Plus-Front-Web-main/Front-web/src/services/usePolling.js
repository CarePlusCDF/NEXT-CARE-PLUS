import { useEffect, useRef } from 'react'

// Schedule from completion, never overlap. Abort and ignore responses after navigation.
export function usePolling(callback, interval = 2500, enabled = true) {
  const latest = useRef(callback)
  useEffect(() => { latest.current = callback }, [callback])
  useEffect(() => {
    if (!enabled) return
    let stopped = false
    let timer
    let busy = false
    const controller = new AbortController()
    async function tick() {
      if (stopped || busy) return
      clearTimeout(timer)
      busy = true
      try { await latest.current(controller.signal) }
      catch (error) { if (error.name !== 'AbortError') console.warn(error.message) }
      finally {
        busy = false
        if (!stopped) timer = setTimeout(tick, interval)
      }
    }
    timer = setTimeout(tick, 0)
    window.addEventListener('estadoAlterado', tick)
    return () => {
      stopped = true
      controller.abort()
      clearTimeout(timer)
      window.removeEventListener('estadoAlterado', tick)
    }
  }, [interval, enabled])
}
