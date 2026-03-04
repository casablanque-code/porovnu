import { useState, createContext, useContext, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, Info, Trash2 } from 'lucide-react'
import styles from './Toast.module.css'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    // Сначала анимация ухода, потом удаление из DOM
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 320)
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  // show(message, type?, action?)
  // action = { label, onClick, duration? }
  const show = useCallback((message, type = 'success', action = null) => {
    const id = Date.now()
    const duration = action?.duration ?? 3500
    setToasts(prev => [...prev, { id, message, type, action, leaving: false }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div className={styles.container}>
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type]} ${t.leaving ? styles.leaving : ''}`}
            onClick={() => !t.action && dismiss(t.id)}
          >
            <span className={styles.icon}>
              {t.type === 'success' && <CheckCircle size={18} strokeWidth={2}/>}
              {t.type === 'error'   && <XCircle     size={18} strokeWidth={2}/>}
              {t.type === 'info'    && <Info        size={18} strokeWidth={2}/>}
              {t.type === 'delete'  && <Trash2      size={18} strokeWidth={2}/>}
            </span>
            <span className={styles.message}>{t.message}</span>
            {t.action && (
              <button
                className={styles.actionBtn}
                onClick={e => { e.stopPropagation(); t.action.onClick(); dismiss(t.id) }}
              >
                {t.action.label}
              </button>
            )}
            {/* Прогресс-бар */}
            <div
              className={styles.progress}
              style={{ animationDuration: `${t.action?.duration ?? 3500}ms` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  const fn = (message, type, action) => ctx.show(message, type, action)
  fn.dismiss = ctx.dismiss
  return fn
}
