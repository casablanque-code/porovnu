import { Calendar, TrendingUp, TrendingDown, Zap, Search, CreditCard, Star } from 'lucide-react'
import styles from './InsightCards.module.css'

function getInsights({ expenses, userId, myName, partnerName, myGender }) {
  const insights = []
  if (expenses.length < 3) return insights

  const now = new Date()

  // ── 1. Самый дорогой день недели ──
  const dayTotals = [0,0,0,0,0,0,0]
  const dayCounts = [0,0,0,0,0,0,0]
  expenses.forEach(e => {
    const d = (new Date(e.created_at).getDay() + 6) % 7 // 0=пн
    dayTotals[d] += Number(e.amount)
    dayCounts[d]++
  })
  const maxDay = dayTotals.indexOf(Math.max(...dayTotals))
  const dayNames = ['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье']
  const dayNamesShort = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
  if (dayTotals[maxDay] > 0) {
    insights.push({
      id: 'hot_day',
      icon: 'Calendar',
      title: `${dayNamesShort[maxDay]} — горячий день`,
      text: `Больше всего трат в ${dayNames[maxDay]}: ₽${Math.round(dayTotals[maxDay]).toLocaleString('ru')} за месяц.`,
      color: '#FFF0E8',
      accent: '#C96A3A',
      bars: dayTotals.map((v, i) => ({ label: dayNamesShort[i], value: v, active: i === maxDay })),
    })
  }

  // ── 2. Дрейф трат (нужны данные за 2+ недели) ──
  const firstHalf = expenses.filter(e => new Date(e.created_at).getDate() <= 15)
  const secondHalf = expenses.filter(e => new Date(e.created_at).getDate() > 15)
  if (firstHalf.length >= 2 && secondHalf.length >= 2) {
    const first = firstHalf.reduce((s,e) => s+Number(e.amount), 0)
    const second = secondHalf.reduce((s,e) => s+Number(e.amount), 0)
    const diff = Math.round((second - first) / first * 100)
    if (Math.abs(diff) >= 15) {
      insights.push({
        id: 'drift',
        icon: diff > 0 ? 'TrendingUp' : 'TrendingDown',
        title: diff > 0 ? 'Траты разгоняются' : 'Траты замедляются',
        text: diff > 0
          ? `Во второй половине месяца вы тратите на ${diff}% больше чем в первой.`
          : `Во второй половине месяца вы тратите на ${Math.abs(diff)}% меньше. Хорошая дисциплина!`,
        color: diff > 0 ? '#FFF0E8' : '#E8F5E8',
        accent: diff > 0 ? '#C96A3A' : '#4A7048',
      })
    }
  }

  // ── 3. Импульсные vs плановые ──
  const impulse = expenses.filter(e => Number(e.amount) < 500)
  const planned = expenses.filter(e => Number(e.amount) >= 500)
  if (impulse.length >= 3) {
    const impulseSum = impulse.reduce((s,e) => s+Number(e.amount), 0)
    const plannedSum = planned.reduce((s,e) => s+Number(e.amount), 0)
    const impulseShare = Math.round(impulseSum / (impulseSum + plannedSum) * 100)
    insights.push({
      id: 'impulse',
      icon: 'Zap',
      title: 'Мелкие траты',
      text: `${impulse.length} покупок до ₽500 — это ${impulseShare}% всех расходов (₽${Math.round(impulseSum).toLocaleString('ru')}). Кофе, перекусы, мелочи.`,
      color: '#F0F0FF',
      accent: '#7B9EC9',
      split: { left: impulseShare, right: 100 - impulseShare, leftLabel: 'мелкие', rightLabel: 'крупные' },
    })
  }

  // ── 4. Категория-сюрприз (самый неожиданный рост) ──
  const catMap = {}
  expenses.forEach(e => {
    if (!catMap[e.category]) catMap[e.category] = { early: 0, late: 0 }
    const day = new Date(e.created_at).getDate()
    if (day <= 15) catMap[e.category].early += Number(e.amount)
    else catMap[e.category].late += Number(e.amount)
  })
  let maxGrowthCat = null, maxGrowth = 0
  Object.entries(catMap).forEach(([cat, v]) => {
    if (v.early > 0 && v.late > 0) {
      const growth = (v.late - v.early) / v.early * 100
      if (growth > maxGrowth) { maxGrowth = growth; maxGrowthCat = cat }
    }
  })
  if (maxGrowthCat && maxGrowth > 30) {
    const CAT_LABELS = { food:'Продукты', home:'Жильё', fun:'Досуг', transport:'Транспорт', health:'Здоровье', cafe:'Кафе', other:'Другое' }
    insights.push({
      id: 'surprise_cat',
      icon: 'Search',
      title: 'Категория растёт',
      text: `«${CAT_LABELS[maxGrowthCat] || maxGrowthCat}» выросла на ${Math.round(maxGrowth)}% во второй половине месяца. Следите за этим.`,
      color: '#FFF8E0',
      accent: '#C9A83A',
    })
  }

  // ── 5. Кто чаще платит ──
  const myCount = expenses.filter(e => e.paid_by === userId).length
  const theirCount = expenses.length - myCount
  if (expenses.length >= 5 && myCount !== theirCount) {
    const more = myCount > theirCount ? myName : partnerName
    const ratio = Math.max(myCount, theirCount)
    const pct = Math.round(ratio / expenses.length * 100)
    insights.push({
      id: 'who_pays',
      icon: 'CreditCard',
      title: `${more} чаще у кассы`,
      text: `${more} добавляет ${pct}% всех трат. Это не значит больше платит — просто чаще вносит данные.`,
      color: '#E8F5FF',
      accent: '#7B9EC9',
      split: {
        left: Math.round(myCount / expenses.length * 100),
        right: Math.round(theirCount / expenses.length * 100),
        leftLabel: myName,
        rightLabel: partnerName,
      },
    })
  }

  // ── 6. Паттерн месяца ──
  const totalDays = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()
  const dayOfMonth = now.getDate()
  if (dayOfMonth >= 10 && expenses.length >= 5) {
    const total = expenses.reduce((s,e) => s+Number(e.amount), 0)
    const dailyRate = total / dayOfMonth
    const projected = Math.round(dailyRate * totalDays)
    insights.push({
      id: 'projection',
      icon: 'Star',
      title: 'Прогноз месяца',
      text: `При текущем темпе к концу месяца потратите ₽${projected.toLocaleString('ru')}. Сейчас прошло ${Math.round(dayOfMonth/totalDays*100)}% месяца.`,
      color: '#F0E8FF',
      accent: '#9B7BC9',
      progress: Math.round(dayOfMonth / totalDays * 100),
    })
  }

  return insights
}

function InsightBar({ bars }) {
  if (!bars) return null
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className={styles.bars}>
      {bars.map((b, i) => (
        <div key={i} className={styles.barCol}>
          <div className={styles.barWrap}>
            <div
              className={`${styles.bar} ${b.active ? styles.barActive : ''}`}
              style={{ height: `${Math.max(b.value / max * 100, 4)}%` }}
            />
          </div>
          <div className={styles.barLabel}>{b.label}</div>
        </div>
      ))}
    </div>
  )
}

function SplitBar({ split, accent }) {
  if (!split) return null
  return (
    <div className={styles.splitWrap}>
      <div className={styles.splitBar}>
        <div className={styles.splitLeft} style={{ width: `${split.left}%`, background: accent }} />
      </div>
      <div className={styles.splitLabels}>
        <span>{split.leftLabel} {split.left}%</span>
        <span>{split.right}% {split.rightLabel}</span>
      </div>
    </div>
  )
}

function ProgressBar({ progress, accent }) {
  if (progress == null) return null
  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progress}%`, background: accent }} />
      </div>
      <div className={styles.progressLabel}>{progress}% месяца позади</div>
    </div>
  )
}


const INSIGHT_ICONS = { Calendar, TrendingUp, TrendingDown, Zap, Search, CreditCard, Star }
function InsightIcon({ name }) {
  const Comp = INSIGHT_ICONS[name]
  return Comp ? <Comp size={20} strokeWidth={1.75} /> : null
}

export default function InsightCards({ expenses, userId, myName, partnerName, myGender }) {
  const insights = getInsights({ expenses, userId, myName, partnerName, myGender })
  if (insights.length === 0) return null

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Инсайты</div>
      <div className={styles.scroll}>
        {insights.map(ins => (
          <div key={ins.id} className={styles.card} style={{ background: ins.color }}>
            <div className={styles.cardHeader}>
              <span className={styles.cardEmoji}><InsightIcon name={ins.icon} /></span>
              <span className={styles.cardTitle} style={{ color: ins.accent }}>{ins.title}</span>
            </div>
            <div className={styles.cardText}>{ins.text}</div>
            <InsightBar bars={ins.bars} />
            <SplitBar split={ins.split} accent={ins.accent} />
            <ProgressBar progress={ins.progress} accent={ins.accent} />
          </div>
        ))}
      </div>
    </div>
  )
}
