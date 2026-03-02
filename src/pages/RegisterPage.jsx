import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import styles from './AuthPage.module.css'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const { signUp, user } = useAuth()
  const navigate = useNavigate()

  // Если юзер уже авторизован — на главную
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user])

  // Восстанавливаем состояние после reload
  useEffect(() => {
    const saved = sessionStorage.getItem('pendingEmail')
    if (saved) {
      setPendingEmail(saved)
      setDone(true)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!gender) { setError('Выбери пол'); return }
    setError('')
    setLoading(true)
    const { error } = await signUp(email, password, { data: { name, gender } })
    if (error) {
      setError(error.message)
    } else {
      // Сохраняем email в sessionStorage — переживёт reload
      sessionStorage.setItem('pendingEmail', email)
      setPendingEmail(email)
      setDone(true)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successEmoji}>💌</div>
          <div className={styles.logo}>Проверь почту</div>
          <div className={styles.successText}>
            Письмо отправлено на <strong>{pendingEmail}</strong>
          </div>
          <div className={styles.successSub}>
            Перейди по ссылке в письме — и попадёшь в приложение сразу. Ссылка работает с любого устройства.
          </div>
          <div className={styles.successHint}>
            📁 Не нашёл? Проверь папку «Спам»
          </div>
          <div className={styles.footer}>
            Не пришло? <span
              className={styles.link}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                sessionStorage.removeItem('pendingEmail')
                setDone(false)
                setEmail('')
                setPassword('')
              }}
            >Попробовать снова</span>
          </div>
          <div className={styles.footer} style={{ marginTop: 8 }}>
            Уже подтвердил? <Link to="/login" className={styles.link}>Войти</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>Поровну</div>
        <div className={styles.subtitle}>создай аккаунт и позови партнёра</div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Твоё имя</label>
            <input className={styles.input} type="text" placeholder="Аня"
              value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Пол</label>
            <div className={styles.genderRow}>
              {[
                { value: 'female', label: '👩 Женский' },
                { value: 'male',   label: '👨 Мужской' },
                { value: 'other',  label: '🧑 Другой'  },
              ].map(g => (
                <button key={g.value} type="button"
                  className={`${styles.genderBtn} ${gender === g.value ? styles.genderSel : ''}`}
                  onClick={() => setGender(g.value)}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Пароль</label>
            <input className={styles.input} type="password" placeholder="минимум 6 символов"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Создаём...' : 'Создать аккаунт →'}
          </button>
        </form>

        <div className={styles.footer}>
          Уже есть аккаунт? <Link to="/login" className={styles.link}>Войти</Link>
        </div>
      </div>
    </div>
  )
}
