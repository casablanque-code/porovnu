import styles from './LoadingScreen.module.css'

export default function LoadingScreen() {
  return (
    <div className={styles.wrap}>
      <div className={styles.logo}>
        <div className={styles.mark}>
          <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="4.5" r="2.2" fill="white"/>
            <rect x="2.5" y="9.5" width="17" height="2.8" rx="1.4" fill="white"/>
            <circle cx="11" cy="17.5" r="2.2" fill="white"/>
          </svg>
        </div>
        <span className={styles.name}>Поровну</span>
      </div>
      <div className={styles.dots}>
        <div className={styles.dot}/>
        <div className={styles.dot}/>
        <div className={styles.dot}/>
      </div>
    </div>
  )
}
