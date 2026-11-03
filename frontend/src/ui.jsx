import { createContext, useCallback, useContext, useEffect, useState } from 'react'

/* ---------- toast notifications ---------- */
const ToastContext = createContext(() => {})
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])

  const toast = useCallback((text, ok = false) => {
    const id = Date.now() + Math.random()
    setItems(list => [...list, { id, text, ok }])
    setTimeout(() => setItems(list => list.filter(t => t.id !== id)), 3800)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div id="toasts">
        {items.map(t => (
          <div key={t.id} className={'toast' + (t.ok ? ' ok' : '')}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/* ---------- modal window ---------- */
export function Modal({ children, onClose, wide }) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' wide' : '')}>{children}</div>
    </div>
  )
}

/* ---------- small pieces ---------- */
export const Tag = ({ status }) => <span className={'tag ' + status}>{status}</span>

export const Empty = ({ children }) => <div className="empty">{children}</div>

export const Field = ({ label, children }) => (
  <div>
    <label>{label}</label>
    {children}
  </div>
)
