import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import styles from './SettingsPage.module.css'

const AVATAR_COLORS = ['#C96A3A','#8BA888','#7B9EC9','#C97BAA','#C9A83A','#7BC9C0']

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [pair, setPair] = useState(null)
  const [pairMode, setPairMode] = useState('split')
  const [savingMode, setSavingMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPair() }, [])

  async function loadPair() {
    const { data } = await supabase.from('pairs').select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).single()
    if (data) { setPair(data); setPairMode(data.mode || 'split') }
    setLoading(false)
  }

  async function handleModeChange(newMode) {
    if (!pair) return
    setSavingMode(true)
    const { error } = await supabase.from('pairs').update({ mode: newMode }).eq('id', pair.id)
    if (!error) setPairMode(newMode)
    setSavingMode(false)
  }

  async function handleCloseMonth() {
    if (!pair) return
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const firstDay = new Date(year, month - 1, 1).toISOString()
    const { data: monthExpenses } = await supabase.from('expenses').select('*')
      .eq('pair_id', pair.id).gte('created_at', firstDay)
    const myTotal = (monthExpenses||[]).filter(e => e.paid_by === user.id).reduce((s,e) => s+Number(e.amount),0)
    const partnerTotal = (monthExpenses||[]).filter(e => e.paid_by !== user.id).reduce((s,e) => s+Number(e.amount),0)
    const totalSpent = myTotal + partnerTotal
    await supabase.from('closed_months').upsert({
      pair_id: pair.id, year, month,
      total_spent: totalSpent, my_total: myTotal,
      partner_total: partnerTotal, balance: myTotal - totalSpent/2,
    })
    alert('Месяц закрыт ✓')
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text-muted)'}}>загружаем...</div>

  const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
  const now = new Date()

  return (
    <div className={styles.wrapper}>
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>← Назад</button>
          <div className={styles.headerTitle}>Настройки</div>
          <div />
        </div>

        {/* Mode — первым делом */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Режим</div>
          <div className={styles.modeRow}>
            {[
              { id:'split', emoji:'⚖️', name:'Поровну', desc:'Делим расходы пополам. Видно кто кому должен.' },
              { id:'shared', emoji:'🏠', name:'Общий бюджет', desc:'Учёт общих трат без подсчёта долгов.' },
            ].map(m => (
              <button key={m.id}
                className={`${styles.modeBtn} ${pairMode === m.id ? styles.modeSel : ''}`}
                onClick={() => handleModeChange(m.id)} disabled={savingMode}>
                <div className={styles.modeEmoji}>{m.emoji}</div>
                <div className={styles.modeName}>{m.name}</div>
                <div className={styles.modeDesc}>{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Nav to sub-pages */}
        <div className={styles.navSection}>
          {[
            { path:'/settings/profile', emoji:'👤', label:'Профиль', sub:'Аватар, имя, пол' },
            { path:'/settings/partner', emoji:'💑', label:'Партнёр', sub:'Инфо и выход из пары' },
            { path:'/settings/history', emoji:'📊', label:'История и аналитика', sub:'Графики, категории, сравнение' },
          ].map(item => (
            <button key={item.path} className={styles.navItem} onClick={() => navigate(item.path)}>
              <div className={styles.navEmoji}>{item.emoji}</div>
              <div className={styles.navText}>
                <div className={styles.navLabel}>{item.label}</div>
                <div className={styles.navSub}>{item.sub}</div>
              </div>
              <div className={styles.navArrow}>→</div>
            </button>
          ))}
        </div>

        {/* Close month */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Закрыть месяц</div>
          <div className={styles.closeMonthText}>Фиксирует итог {monthNames[now.getMonth()]} в архив.</div>
          <button className={styles.closeBtn} onClick={handleCloseMonth}>
            Закрыть {monthNames[now.getMonth()]} →
          </button>
        </div>

        <div className={styles.section}>
          <button className={styles.signOutBtn} onClick={signOut}>Выйти из аккаунта</button>
        </div>
      </div>
    </div>
  )
}
