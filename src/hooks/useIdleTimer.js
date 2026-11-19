import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

const IDLE_MS = 120_000 // 120 segundos

export function useIdleTimer() {
  const navigate    = useNavigate()
  const logoutAdmin = useStore(s => s.logoutAdmin)
  const timer       = useRef(null)

  const reset = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      logoutAdmin()
      navigate('/', { replace: true })
    }, IDLE_MS)
  }

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, reset))
    reset()
    return () => {
      clearTimeout(timer.current)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [])
}
