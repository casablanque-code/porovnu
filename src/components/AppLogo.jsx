import { useEffect, useRef, useState } from 'react'
import iconSplit  from '../assets/icon-split.png'
import iconShared from '../assets/icon-shared.png'
import styles from './AppLogo.module.css'

export default function AppLogo({ mode, monthName }) {
  const [visible, setVisible] = useState(true)
  const prevMode = useRef(mode)

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

  const icon = mode === 'split' ? iconSplit : iconShared

  return (
    <div className={styles.wrap}>
      <div className={`${styles.logoRow} ${visible ? styles.visible : styles.hidden}`}>
        <img
          src={icon}
          alt=""
          className={styles.mark}
        />
        <div className={styles.text}>
          <div className={styles.name}>Поровну</div>
        </div>
      </div>
      <div className={styles.month}>{monthName}</div>
    </div>
  )
}
