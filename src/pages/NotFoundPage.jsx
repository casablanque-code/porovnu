import { useNavigate } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.emoji}>🗺️</div>
        <h1 className={styles.title}>Страница не найдена</h1>
        <p className={styles.sub}>Возможно ссылка устарела или была удалена</p>
        <button className={styles.btn} onClick={() => navigate('/')}>На главную →</button>
      </div>
      <div className={styles.blob1}/>
      <div className={styles.blob2}/>
    </div>
  )
}
