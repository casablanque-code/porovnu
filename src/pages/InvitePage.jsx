import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import styles from './InvitePage.module.css'

export default function InvitePage() {
  const { code } = useParams()
  const { user, loading: authLoading, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [authError, setAuthError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (user) handleInvite()
    else setStatus('needAuth')
  }, [user, authLoading])

  async function handleInvite() {
    setStatus('loading')
    const { data: invite } = await supabase
      .from('invites')
      .select('*')
      .eq('code', code)
      .eq('used', false)
      .single()

    if (!invite) { setStatus('error'); return }
    if (invite.created_by === user.id) { setStatus('self'); return }

    const { data: existingPair } = await supabase
      .from('pairs')
      .select('id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (existingPair) { navigate('/'); return }

    const { error: pairError } = await supabase
      .from('pairs')
      .insert({ user1_id: invite.created_by, user2_id: user.id })

    if (pairError) { setStatus('error'); return }

    await supabase.from('invites').update({ used: true }).eq('code', code)
    setStatus('success')
    setTimeout(() => navigate('/'), 2000)
  }

  async function handleAuth(e) {
    e.preventDefault()
    setAuthError('')
    setSubmitting(true)
    const { error } = authMode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, { data: { name } })
    if (error) setAuthError(error.message)
    setSubmitting(false)
  }

  if (authLoading) return null

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {status === 'needAuth' && (
          <>
            <div className={styles.emoji}>💌</div>
            <div className={styles.title}>Тебя приглашают!</div>
            <div className={styles.sub}>
              {authMode === 'login'
                ? 'Войди чтобы принять приглашение'
                : 'Создай аккаунт чтобы принять приглашение'}
            </div>
            <form onSubmit={handleAuth} className={styles.form}>
              {authMode === 'register' && (
                <input className={styles.input} type="text" placeholder="Твоё имя"
                  value={name} onChange={e => setName(e.target.value)} required />
              )}
              <input className={styles.input} type="email" placeholder="Email"
                value={email} onChange={e => setEmail(e.target.value)} required />
              <input className={styles.input} type="password" placeholder="Пароль"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              {authError && <div className={styles.error}>{authError}</div>}
              <button className={styles.btn} type="submit" disabled={submitting}>
                {submitting ? 'Подождите...' : authMode === 'login' ? 'Войти →' : 'Создать аккаунт →'}
              </button>
            </form>
            <div className={styles.toggle}>
              {authMode === 'login'
                ? <>Нет аккаунта? <span onClick={() => setAuthMode('register')}>Зарегистрироваться</span></>
                : <>Уже есть аккаунт? <span onClick={() => setAuthMode('login')}>Войти</span></>
              }
            </div>
          </>
        )}

        {status === 'loading' && (
          <><div className={styles.emoji}>⏳</div><div className={styles.title}>Подключаемся...</div></>
        )}
        {status === 'success' && (
          <><div className={styles.emoji}>🎉</div><div className={styles.title}>Пара создана!</div>
          <div className={styles.sub}>Переходим к общему бюджету...</div></>
        )}
        {status === 'error' && (
          <><div className={styles.emoji}>😕</div><div className={styles.title}>Ссылка не работает</div>
          <div className={styles.sub}>Попроси партнёра прислать новую ссылку</div>
          <button className={styles.btn} onClick={() => navigate('/')}>На главную</button></>
        )}
        {status === 'self' && (
          <><div className={styles.emoji}>🤔</div><div className={styles.title}>Это твоя ссылка</div>
          <div className={styles.sub}>Отправь её партнёру, а не себе 😄</div>
          <button className={styles.btn} onClick={() => navigate('/')}>Понял</button></>
        )}
      </div>
    </div>
  )
}
