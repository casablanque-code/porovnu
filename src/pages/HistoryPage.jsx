import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DEFAULT_CATEGORIES, CatIcon } from '../components/CategoryFilter'
import { BarChart2 } from 'lucide-react'
import LoadingScreen from '../components/LoadingScreen'
import styles from './HistoryPage.module.css'

const PERIODS = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'year', label: 'Год' },
]
const MONTH_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']
const DAY_NAMES   = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function buildWeekData(expenses, userId) {
  // Строим по датам из expenses — не привязываемся к "сегодня"
  // Показываем 7 дней текущей недели но считаем только что есть в expenses
  const now = new Date()
  const dow = now.getDay() || 7
  return DAY_NAMES.map((label, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (dow - 1) + i)
    const ds = d.toDateString()
    const day = expenses.filter(e => new Date(e.created_at).toDateString() === ds)
    return {
      label,
      mine:   day.filter(e=>e.paid_by===userId).reduce((s,e)=>s+Number(e.amount),0),
      theirs: day.filter(e=>e.paid_by!==userId).reduce((s,e)=>s+Number(e.amount),0),
    }
  })
}

function buildMonthData(expenses, userId, year, month) {
  const dim = new Date(year, month+1, 0).getDate()
  return [1,2,3,4].map(w => {
    const start = (w-1)*7+1, end = Math.min(w*7, dim)
    const wexp = expenses.filter(e => {
      const d = new Date(e.created_at)
      return d.getFullYear()===year && d.getMonth()===month && d.getDate()>=start && d.getDate()<=end
    })
    return {
      label: `${start}-${end}`,
      mine:   wexp.filter(e=>e.paid_by===userId).reduce((s,e)=>s+Number(e.amount),0),
      theirs: wexp.filter(e=>e.paid_by!==userId).reduce((s,e)=>s+Number(e.amount),0),
    }
  })
}

function buildYearData(expenses, userId, year) {
  return MONTH_SHORT.map((label, i) => {
    const mexp = expenses.filter(e => {
      const d = new Date(e.created_at)
      return d.getFullYear()===year && d.getMonth()===i
    })
    return {
      label,
      mine:   mexp.filter(e=>e.paid_by===userId).reduce((s,e)=>s+Number(e.amount),0),
      theirs: mexp.filter(e=>e.paid_by!==userId).reduce((s,e)=>s+Number(e.amount),0),
    }
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
      return { id, label: cat?.label||id, icon: cat?.icon||cat?.emoji||'Package', ...data }
    })
    .sort((a,b) => b.total - a.total)
    .slice(0, 6)
}

export default function HistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const now = new Date()
  const [period, setPeriod]             = useState('month')
  const [year, setYear]                 = useState(now.getFullYear())
  const [expenses, setExpenses]         = useState([])
  const [prevExpenses, setPrevExpenses] = useState([])
  const [categories, setCategories]     = useState([])
  const [pair, setPair]                 = useState(null)
  const [myName, setMyName]             = useState('Я')
  const [partnerName, setPartnerName]   = useState('Партнёр')
  const [pairMode, setPairMode]         = useState('split')
  const [loading, setLoading]           = useState(true)
  const [chartKey, setChartKey]         = useState(0)
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  useEffect(() => { loadAll() }, [])
  useEffect(() => { if (pair) loadExpenses(pair.id) }, [period, year, pair])

  async function loadAll() {
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.name) setMyName(prof.name)

    const { data: pairData } = await supabase.from('pairs').select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).single()
    if (!pairData) { setLoading(false); return }
    setPair(pairData)
    setPairMode(pairData.mode || 'split')

    const partnerId = pairData.user1_id === user.id ? pairData.user2_id : pairData.user1_id
    const { data: p } = await supabase.from('profiles').select('*').eq('id', partnerId).single()
    if (p?.name) setPartnerName(p.name)

    const { data: cats } = await supabase.from('pair_categories').select('*').eq('pair_id', pairData.id)
    const allCats = [
      ...DEFAULT_CATEGORIES.filter(c=>c.id!=='all'),
      ...(cats||[]).map(d=>({ id:d.id, label:d.label, icon:d.emoji })),
    ]
    setCategories(allCats)
    setLoading(false)
  }

  async function loadExpenses(pairId) {
    // Всегда ставим точные границы по году — никаких «от from до бесконечности»
    let from, to, prevFrom, prevTo

    if (period === 'week') {
      // Неделя всегда текущая, но фильтруем только expenses нужного года
      const dow = now.getDay() || 7
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate()-(dow-1))
      from.setHours(0,0,0,0)
      to = new Date(from); to.setDate(from.getDate()+7)
      prevFrom = new Date(from); prevFrom.setDate(from.getDate()-7)
      prevTo   = new Date(from)
    } else if (period === 'month') {
      from     = new Date(year, currentMonth, 1)
      to       = new Date(year, currentMonth+1, 1)
      prevFrom = new Date(year, currentMonth-1, 1)
      prevTo   = new Date(year, currentMonth, 1)
    } else {
      // Год — строгие границы [year-01-01, year+1-01-01)
      from     = new Date(year, 0, 1)
      to       = new Date(year+1, 0, 1)
      prevFrom = new Date(year-1, 0, 1)
      prevTo   = new Date(year, 0, 1)
    }

    const [{ data: curr }, { data: prev }] = await Promise.all([
      supabase.from('expenses').select('*').eq('pair_id', pairId)
        .gte('created_at', from.toISOString())
        .lt('created_at', to.toISOString())
        .order('created_at'),
      supabase.from('expenses').select('*').eq('pair_id', pairId)
        .gte('created_at', prevFrom.toISOString())
        .lt('created_at', prevTo.toISOString()),
    ])
    setExpenses(curr || [])
    setPrevExpenses(prev || [])
  }

  const chartData = period==='week'
    ? buildWeekData(expenses, user.id)
    : period==='month'
      ? buildMonthData(expenses, user.id, year, currentMonth)
      : buildYearData(expenses, user.id, year)

  const maxVal     = Math.max(...chartData.map(d=>d.mine+d.theirs), 1)
  const totalSpent = expenses.reduce((s,e)=>s+Number(e.amount),0)
  const prevTotal  = prevExpenses.reduce((s,e)=>s+Number(e.amount),0)
  const myTotal    = expenses.filter(e=>e.paid_by===user.id).reduce((s,e)=>s+Number(e.amount),0)
  const theirTotal = totalSpent - myTotal
  const diff       = prevTotal > 0 ? Math.round((totalSpent - prevTotal) / prevTotal * 100) : null
  const catData    = buildCategoryData(expenses, categories)

  if (loading) return <LoadingScreen />

  return (
    <div className={styles.wrapper}>
      <div className={styles.page}>

        {/* Header — только назад + заголовок */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/settings')}>‹</button>
          <div className={styles.headerTitle}>История</div>
          <div style={{width:32}}/>
        </div>

        {/* Summary cards */}
        <div className={styles.summaryRow}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryValRow}>
              <div className={styles.summaryVal}>₽{Math.round(totalSpent).toLocaleString('ru')}</div>
              {diff !== null && (
                <span className={diff>0 ? styles.diffUp : styles.diffDown}>
                  {diff>0?'↑':'↓'}{Math.abs(diff)}%
                </span>
              )}
            </div>
            <div className={styles.summaryLabel}>потрачено вместе</div>
          </div>
          {pairMode === 'split' ? (
            <div className={styles.summaryCard}>
              <div className={styles.summaryVal}>₽{Math.round(totalSpent/2).toLocaleString('ru')}</div>
              <div className={styles.summaryLabel}>поровну каждому</div>
            </div>
          ) : (
            <div className={styles.summaryCard}>
              <div className={styles.summaryVal}>₽{Math.round(myTotal).toLocaleString('ru')}</div>
              <div className={styles.summaryLabel}>ты потратил</div>
            </div>
          )}
        </div>

        {/* Who spent */}
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

        {/* Year switcher — над графиком */}
        <div className={styles.yearRow}>
          <button className={styles.yearBtn} onClick={() => { setYear(y=>y-1); setChartKey(k=>k+1) }}>‹</button>
          <span className={styles.yearLabel}>{year}</span>
          <button className={styles.yearBtn} onClick={() => { setYear(y=>y+1); setChartKey(k=>k+1) }} disabled={year >= currentYear}>›</button>
        </div>

        {/* Chart */}
        <div className={styles.chartSection}>
          <div className={styles.chartLegend}>
            <div className={styles.legendItem}><div className={styles.legendDot} style={{background:'#C96A3A'}}/>{myName}</div>
            <div className={styles.legendItem}><div className={styles.legendDot} style={{background:'#8BA888'}}/>{partnerName}</div>
          </div>
          <div key={chartKey} className={styles.chartAnimating}>
          {totalSpent === 0 ? (
            <div className={styles.empty}>
              <BarChart2 size={40} color="var(--text-muted)" strokeWidth={1.5}/>
              <div>Нет трат за этот период</div>
            </div>
          ) : (
            <div className={styles.chart}>
              {chartData.map((d,i) => {
                const total = d.mine+d.theirs
                const h = (total/maxVal*100)
                const myPct = total>0 ? d.mine/total*100 : 50
                return (
                  <div key={i} className={styles.barCol}>
                    <div className={styles.barTooltip}>{total>0 && `₽${Math.round(total).toLocaleString('ru')}`}</div>
                    <div className={styles.barWrap}>
                      {total>0 && (
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
          {/* Period tabs — под графиком */}
          <div className={styles.periodTabs}>
            {PERIODS.map(p => (
              <button key={p.id}
                className={`${styles.periodTab} ${period===p.id?styles.periodActive:''}`}
                onClick={() => { setPeriod(p.id); setChartKey(k=>k+1) }}>{p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top categories */}
        {catData.length > 0 && (
          <div className={styles.catsSection}>
            <div className={styles.sectionTitle}>Топ категорий {period==='year'?year:''}</div>
            {catData.map((cat,i) => (
              <div key={cat.id} className={styles.catRow}>
                <div className={styles.catRank}>{i+1}</div>
                <div className={styles.catIconWrap}>
                  <CatIcon icon={cat.icon} emoji={cat.emoji} size={18} color="var(--brown)" strokeWidth={1.6}/>
                </div>
                <div className={styles.catInfo}>
                  <div className={styles.catName}>{cat.label}</div>
                  <div className={styles.catBar}>
                    <div className={styles.catBarFill} style={{width:`${(cat.total/catData[0].total*100).toFixed(0)}%`}}/>
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

      </div>
    </div>
  )
}
