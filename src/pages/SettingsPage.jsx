import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { User, Users, BarChart2, Scale, Home, ChevronRight } from 'lucide-react'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [pair, setPair]           = useState(null)
  const [pairMode, setPairMode]   = useState('split')
  const [savingMode, setSavingMode] = useState(false)
  const [loading, setLoading]     = useState(true)

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
    const myTotal      = (monthExpenses||[]).filter(e=>e.paid_by===user.id).reduce((s,e)=>s+Number(e.amount),0)
    const partnerTotal = (monthExpenses||[]).filter(e=>e.paid_by!==user.id).reduce((s,e)=>s+Number(e.amount),0)
    const totalSpent   = myTotal + partnerTotal
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

  const NAV_ITEMS = [
    { path: '/settings/profile', Icon: User,     label: 'Профиль',            sub: 'Аватар, имя, пол' },
    { path: '/settings/partner', Icon: Users,    label: 'Партнёр',            sub: 'Инфо и выход из пары' },
    { path: '/settings/history', Icon: BarChart2,label: 'История и аналитика',sub: 'Графики, категории, сравнение' },
  ]

  const MODE_ITEMS = [
    { id: 'split',  Icon: Scale, name: 'Поровну',       desc: 'Делим расходы пополам. Видно кто кому должен.' },
    { id: 'shared', Icon: Home,  name: 'Общий бюджет',  desc: 'Учёт общих трат без подсчёта долгов.' },
  ]

  return (
    <div className={styles.wrapper}>
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>‹</button>
          <div className={styles.headerTitle}>Настройки</div>
          <div style={{width:32}}/>
        </div>

        {/* Режим */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Режим</div>
          <div className={styles.modeRow}>
            {MODE_ITEMS.map(({ id, Icon, name, desc }) => (
              <button key={id}
                className={`${styles.modeBtn} ${pairMode === id ? styles.modeSel : ''}`}
                onClick={() => handleModeChange(id)} disabled={savingMode}>
                <div className={styles.modeIcon}>
                  <Icon size={22} strokeWidth={1.6}
                    color={pairMode === id ? 'var(--terracotta)' : 'var(--brown-light)'}/>
                </div>
                <div className={styles.modeName}>{name}</div>
                <div className={styles.modeDesc}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Навигация */}
        <div className={styles.navSection}>
          {NAV_ITEMS.map(({ path, Icon, label, sub }) => (
            <button key={path} className={styles.navItem} onClick={() => navigate(path)}>
              <div className={styles.navIconWrap}>
                <Icon size={20} strokeWidth={1.75} color="var(--brown-light)"/>
              </div>
              <div className={styles.navText}>
                <div className={styles.navLabel}>{label}</div>
                <div className={styles.navSub}>{sub}</div>
              </div>
              <ChevronRight size={18} strokeWidth={2} color="var(--brown-light)" style={{opacity:0.5}}/>
            </button>
          ))}
        </div>

        {/* Закрыть месяц */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Закрыть месяц</div>
          <div className={styles.closeMonthText}>Фиксирует итог {monthNames[now.getMonth()]} в архив.</div>
          <button className={styles.closeBtn} onClick={handleCloseMonth}>
            Закрыть {monthNames[now.getMonth()]}
          </button>
        </div>

        <div className={styles.section}>
          <button className={styles.signOutBtn} onClick={signOut}>Выйти из аккаунта</button>
        </div>
      </div>
    </div>
  )
}
