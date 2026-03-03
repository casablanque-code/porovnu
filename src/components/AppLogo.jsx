import { useEffect, useRef, useState } from 'react'
import styles from './AppLogo.module.css'

// Вариант А — знак деления ÷, режим "Поровну"
function LogoSplit() {
  return (
    <div className={styles.markSplit}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="4.5" r="2.2" fill="white"/>
        <rect x="2.5" y="9.5" width="17" height="2.8" rx="1.4" fill="white"/>
        <circle cx="11" cy="17.5" r="2.2" fill="white"/>
      </svg>
    </div>
  )
}

// Вариант Д — П в круге с двумя цветами, режим "Общий бюджет"
function LogoShared() {
  return (
    <div className={styles.markShared}>
      <div className={styles.markSharedInner}>П</div>
    </div>
  )
}

export default function AppLogo({ mode, monthName }) {
  const [visible, setVisible] = useState(true)
  const prevMode = useRef(mode)

  // Анимация смены логотипа при смене режима
  useEffect(() => {
    if (prevMode.current !== mode) {
      setVisible(false)
      const t = setTimeout(() => {
        setVisible(true)
        prevMode.current = mode
      }, 180)
      return () => clearTimeout(t)
    }
  }, [mode])

  return (
    <div className={styles.wrap}>
      <div className={`${styles.logoRow} ${visible ? styles.visible : styles.hidden}`}>
        {mode === 'split' ? <LogoSplit /> : <LogoShared />}
        <div className={styles.text}>
          <div className={styles.name}>Поровну</div>
        </div>
      </div>
      <div className={styles.month}>{monthName}</div>
    </div>
  )
}
