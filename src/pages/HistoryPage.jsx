import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import styles from './HistoryPage.module.css'

const PERIODS = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'year', label: 'Год' },
]

const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTH_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']
const DAY_NAMES = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function buildWeekData(expenses, userId) {
  const now = new Date()
  const dow = now.getDay() || 7
  return DAY_NAMES.map((label, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (dow - 1) + i)
    const ds = d.toDateString()
    const day = expenses.filter(e => new Date(e.created_at).toDateString() === ds)
    return { label, mine: day.filter(e => e.paid_by === userId).reduce((s,e)=>s+Number(e.amount),0), theirs: day.filter(e=>e.paid_by!==userId).reduce((s,e)=>s+Number(e.amount),0) }
  })
}

function buildMonthData(expenses, userId) {
  const now = new Date()
  const dim = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()
  return [1,2,3,4].map(w => {
    const start=(w-1)*7+1, end=Math.min(w*7,dim)
    const wexp = expenses.filter(e=>{const d=new Date(e.created_at);return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()>=start&&d.getDate()<=end})
    return { label:`${start}-${end}`, mine:wexp.filter(e=>e.paid_by===userId).reduce((s,e)=>s+Number(e.amount),0), theirs:wexp.filter(e=>e.paid_by!==userId).reduce((s,e)=>s+Number(e.amount),0) }
  })
}

function buildYearData(expenses, userId) {
  const now = new Date()
  return MONTH_SHORT.map((label,i) => {
    const mexp = expenses.filter(e=>{const d=new Date(e.created_at);return d.getFullYear()===now.getFullYear()&&d.getMonth()===i})
    return { label, mine:mexp.filter(e=>e.paid_by===userId).reduce((s,e)=>s+Number(e.amount),0), theirs:mexp.filter(e=>e.paid_by!==userId).reduce((s,e)=>s+Number(e.amount),0) }
  })
}

function buildCategoryData(expenses, categories) {
  const map = {}
  expenses.forEach(e => {
    if (!map[e.category]) map[e.category] = { total: 0, count: 0 }
    map[e.category].total += Number(e.amount)
    map[e.category].count += 1
  })
  return Object.entries(map)
    .map(([id, data]) => {
      const cat = categories?.find(c=>c.id===id)
      return { id, label: cat?.label||id, emoji: cat?.emoji||'📦', ...data }
    })
    .sort((a,b) => b.total - a.total)
    .slice(0, 6)
}

export default function HistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [period, setPeriod] = useState('month')
  const [expenses, setExpenses] = useState([])
  const [prevExpenses, setPrevExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [pair, setPair] = useState(null)
  const [myName, setMyName] = useState('Я')
  const [partnerName, setPartnerName] = useState('Партнёр')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])
  useEffect(() => { if (pair) loadExpenses(pair.id) }, [period, pair])

  async function loadAll() {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.name) setMyName(prof.name)

    const { data: pairData } = await supabase.from('pairs').select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).single()
    if (!pairData) { setLoading(false); return }
    setPair(pairData)

    const partnerId = pairData.user1_id === user.id ? pairData.user2_id : pairData.user1_id
    const { data: p } = await supabase.from('profiles').select('*').eq('id', partnerId).single()
    if (p?.name) setPartnerName(p.name)

    const { data: cats } = await supabase.from('pair_categories').select('*').eq('pair_id', pairData.id)
    const DEFAULT_CATS = [
      {id:'food',label:'Продукты',emoji:'🛒'},{id:'home',label:'Жильё',emoji:'🏠'},
      {id:'fun',label:'Досуг',emoji:'🎉'},{id:'transport',label:'Транспорт',emoji:'🚗'},
      {id:'health',label:'Здоровье',emoji:'💊'},{id:'cafe',label:'Кафе',emoji:'☕'},
      {id:'other',label:'Другое',emoji:'📦'},
    ]
    setCategories([...DEFAULT_CATS, ...(cats||[])])
    setLoading(false)
  }

  async function loadExpenses(pairId) {
    const now = new Date()
    let from, prevFrom, prevTo

    if (period === 'week') {
      const dow = now.getDay()||7
      from = new Date(now); from.setDate(now.getDate()-(dow-1)); from.setHours(0,0,0,0)
      prevFrom = new Date(from); prevFrom.setDate(from.getDate()-7)
      prevTo = new Date(from)
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      prevFrom = new Date(now.getFullYear(), now.getMonth()-1, 1)
      prevTo = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      from = new Date(now.getFullYear(), 0, 1)
      prevFrom = new Date(now.getFullYear()-1, 0, 1)
      prevTo = new Date(now.getFullYear(), 0, 1)
    }

    const [{ data: curr }, { data: prev }] = await Promise.all([
      supabase.from('expenses').select('*').eq('pair_id', pairId).gte('created_at', from.toISOString()).order('created_at'),
      supabase.from('expenses').select('*').eq('pair_id', pairId).gte('created_at', prevFrom.toISOString()).lt('created_at', prevTo.toISOString()),
    ])
    setExpenses(curr || [])
    setPrevExpenses(prev || [])
  }

  const chartData = period==='week' ? buildWeekData(expenses,user.id)
    : period==='month' ? buildMonthData(expenses,user.id)
    : buildYearData(expenses,user.id)

  const maxVal = Math.max(...chartData.map(d=>d.mine+d.theirs), 1)
  const totalSpent = expenses.reduce((s,e)=>s+Number(e.amount),0)
  const prevTotal = prevExpenses.reduce((s,e)=>s+Number(e.amount),0)
  const myTotal = expenses.filter(e=>e.paid_by===user.id).reduce((s,e)=>s+Number(e.amount),0)
  const theirTotal = totalSpent - myTotal
  const diff = prevTotal > 0 ? Math.round((totalSpent - prevTotal) / prevTotal * 100) : null
  const catData = buildCategoryData(expenses, categories)

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text-muted)'}}>загружаем...</div>

  return (
    <div className={styles.wrapper}>
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/settings')}>← Назад</button>
          <div className={styles.headerTitle}>История</div>
          <div className={styles.periodTabs}>
            {PERIODS.map(p => (
              <button key={p.id} className={`${styles.periodTab} ${period===p.id?styles.periodActive:''}`}
                onClick={() => setPeriod(p.id)}>{p.label}</button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className={styles.summaryRow}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryVal}>₽{Math.round(totalSpent).toLocaleString('ru')}</div>
            <div className={styles.summaryLabel}>потрачено вместе</div>
            {diff !== null && (
              <div className={`${styles.diffBadge} ${diff>0?styles.diffUp:styles.diffDown}`}>
                {diff>0?'↑':'↓'} {Math.abs(diff)}% vs прошлый
              </div>
            )}
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryVal}>₽{Math.round(totalSpent/2).toLocaleString('ru')}</div>
            <div className={styles.summaryLabel}>поровну каждому</div>
          </div>
        </div>

        {/* Who spent more */}
        {totalSpent > 0 && (
          <div className={styles.whoCard}>
            <div className={styles.whoRow}>
              <span className={styles.whoName}>{myName}</span>
              <div className={styles.whoBarWrap}>
                <div className={styles.whoBarMine} style={{width:`${(myTotal/totalSpent*100).toFixed(1)}%`}}/>
                <div className={styles.whoBarTheirs} style={{width:`${(theirTotal/totalSpent*100).toFixed(1)}%`}}/>
              </div>
              <span className={styles.whoName}>{partnerName}</span>
            </div>
            <div className={styles.whoAmounts}>
              <span>₽{Math.round(myTotal).toLocaleString('ru')}</span>
              <span>₽{Math.round(theirTotal).toLocaleString('ru')}</span>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className={styles.chartSection}>
          <div className={styles.chartLegend}>
            <div className={styles.legendItem}><div className={styles.legendDot} style={{background:'#C96A3A'}}/>{myName}</div>
            <div className={styles.legendItem}><div className={styles.legendDot} style={{background:'#8BA888'}}/>{partnerName}</div>
          </div>
          {totalSpent === 0 ? (
            <div className={styles.empty}><div style={{fontSize:40}}>📊</div><div>Нет трат за этот период</div></div>
          ) : (
            <div className={styles.chart}>
              {chartData.map((d,i) => {
                const total = d.mine+d.theirs
                const h = (total/maxVal*100)
                const myPct = total>0 ? d.mine/total*100 : 50
                return (
                  <div key={i} className={styles.barCol}>
                    <div className={styles.barTooltip}>
                      {total > 0 && `₽${Math.round(total).toLocaleString('ru')}`}
                    </div>
                    <div className={styles.barWrap}>
                      {total > 0 && (
                        <div className={styles.bar} style={{height:`${h}%`}}>
                          <div className={styles.barMine} style={{height:`${myPct}%`}}/>
                          <div className={styles.barTheirs} style={{height:`${100-myPct}%`}}/>
                        </div>
                      )}
                    </div>
                    <div className={styles.barLabel}>{d.label}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top categories */}
        {catData.length > 0 && (
          <div className={styles.catsSection}>
            <div className={styles.sectionTitle}>Топ категорий</div>
            {catData.map((cat, i) => (
              <div key={cat.id} className={styles.catRow}>
                <div className={styles.catRank}>{i+1}</div>
                <div className={styles.catEmoji}>{cat.emoji}</div>
                <div className={styles.catInfo}>
                  <div className={styles.catName}>{cat.label}</div>
                  <div className={styles.catBar}>
                    <div className={styles.catBarFill}
                      style={{width:`${(cat.total/catData[0].total*100).toFixed(0)}%`}}/>
                  </div>
                </div>
                <div className={styles.catRight}>
                  <div className={styles.catTotal}>₽{Math.round(cat.total).toLocaleString('ru')}</div>
                  <div className={styles.catCount}>{cat.count} трат</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comparison with prev period */}
        {prevTotal > 0 && (
          <div className={styles.compSection}>
            <div className={styles.sectionTitle}>Сравнение с прошлым периодом</div>
            <div className={styles.compRow}>
              <div className={styles.compItem}>
                <div className={styles.compLabel}>Сейчас</div>
                <div className={styles.compVal}>₽{Math.round(totalSpent).toLocaleString('ru')}</div>
              </div>
              <div className={`${styles.compArrow} ${diff>0?styles.compUp:styles.compDown}`}>
                {diff===0?'=':diff>0?`↑${diff}%`:`↓${Math.abs(diff)}%`}
              </div>
              <div className={styles.compItem}>
                <div className={styles.compLabel}>Прошлый</div>
                <div className={styles.compVal}>₽{Math.round(prevTotal).toLocaleString('ru')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
