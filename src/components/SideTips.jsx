import styles from './SideTips.module.css'

const LEFT_TIPS = [
  {
    emoji: '💡',
    title: 'Добавляй сразу',
    text: 'Чек на кассе — трата в приложении. Не копи до вечера, забудешь сумму.',
  },
  {
    emoji: '🔒',
    title: 'Приватно',
    text: 'Данные видит только твой партнёр. Никакой рекламы, никаких третьих лиц.',
  },
]

function getPartnerEmoji(myGender, partnerGender, mode) {
  const me = myGender === 'female' ? '👩' : myGender === 'male' ? '👨' : '🧑'
  const them = partnerGender === 'female' ? '👩' : partnerGender === 'male' ? '👨' : '🧑'
  return mode === 'shared' ? `${me}❤️${them}` : `${me}${them}`
}

// Те же инсайты что на мобиле — для десктопной боковой панели
function getInsights({ expenses, userId, myName, partnerName, myGender, myTotal, theirTotal, totalSpent, expenseCount, pairMode }) {
  const cards = []
  if (!expenses || expenses.length === 0) return cards

  const now = new Date()
  const partnerEmoji = getPartnerEmoji(myGender, 'other', pairMode)
  const modeLabel = pairMode === 'shared' ? 'Общий бюджет' : 'Поровну'

  // Карточка пары — всегда
  cards.push({
    emoji: partnerEmoji,
    title: `${myName} и ${partnerName}`,
    text: `Режим: ${modeLabel}`,
    color: '#FFF0E8',
    accent: '#C96A3A',
  })

  // Статистика месяца
  if (totalSpent > 0) {
    const avg = expenseCount > 0 ? Math.round(totalSpent / expenseCount) : 0
    const myShare = Math.round(myTotal / totalSpent * 100)
    cards.push({
      emoji: '📊',
      title: 'Этот месяц',
      text: `${expenseCount} трат · ₽${Math.round(totalSpent).toLocaleString('ru')}\nСредняя: ₽${avg.toLocaleString('ru')}\n${myName}: ${myShare}%`,
      color: '#E8F5E8',
      accent: '#4A7048',
    })
  }

  // Прогноз
  const dayOfMonth = now.getDate()
  const totalDays = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()
  if (dayOfMonth >= 7 && totalSpent > 0) {
    const projected = Math.round(totalSpent / dayOfMonth * totalDays)
    cards.push({
      emoji: '🔮',
      title: 'Прогноз',
      text: `При текущем темпе к концу месяца: ₽${projected.toLocaleString('ru')}`,
      color: '#F0E8FF',
      accent: '#9B7BC9',
      progress: Math.round(dayOfMonth / totalDays * 100),
    })
  }

  // Горячий день
  if (expenses.length >= 5) {
    const dayTotals = [0,0,0,0,0,0,0]
    expenses.forEach(e => {
      const d = (new Date(e.created_at).getDay() + 6) % 7
      dayTotals[d] += Number(e.amount)
    })
    const maxDay = dayTotals.indexOf(Math.max(...dayTotals))
    const dayNames = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
    cards.push({
      emoji: '📅',
      title: `${dayNames[maxDay]} — горячий день`,
      text: `Больше всего трат именно в этот день недели`,
      color: '#FFF8E0',
      accent: '#C9A83A',
      bars: dayTotals.map((v, i) => ({ label: dayNames[i], value: v, active: i === maxDay })),
    })
  }

  return cards
}

function ProgressBar({ progress, accent }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 5, background: 'rgba(0,0,0,0.08)', borderRadius: 50, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: accent, borderRadius: 50 }} />
      </div>
      <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)', marginTop: 3, fontWeight: 600 }}>
        {progress}% месяца прошло
      </div>
    </div>
  )
}

function MiniBar({ bars }) {
  if (!bars) return null
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32, marginTop: 8 }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{
              width: '100%',
              height: `${Math.max(b.value / max * 100, 8)}%`,
              background: b.active ? '#C96A3A' : 'rgba(0,0,0,0.1)',
              borderRadius: '2px 2px 0 0',
            }} />
          </div>
          <div style={{ fontSize: 7, color: 'rgba(0,0,0,0.35)', fontWeight: 700, marginTop: 2 }}>{b.label}</div>
        </div>
      ))}
    </div>
  )
}

export function LeftTips() {
  return (
    <div className={styles.side}>
      {LEFT_TIPS.map((tip, i) => (
        <div key={i} className={styles.tip}>
          <div className={styles.tipEmoji}>{tip.emoji}</div>
          <div className={styles.tipTitle}>{tip.title}</div>
          <div className={styles.tipText}>{tip.text}</div>
        </div>
      ))}
    </div>
  )
}

export function RightTips({ myName, partnerName, myGender, partnerGender, totalSpent, expenseCount, myTotal, theirTotal, pairMode, expenses, userId }) {
  const insights = getInsights({ expenses: expenses || [], userId, myName, partnerName, myGender, myTotal, theirTotal, totalSpent, expenseCount, pairMode })

  return (
    <div className={styles.side}>
      {insights.map((ins, i) => (
        <div key={i} className={styles.insightCard} style={{ background: ins.color }}>
          <div className={styles.insightHeader}>
            <span className={styles.insightEmoji}>{ins.emoji}</span>
            <span className={styles.insightTitle} style={{ color: ins.accent }}>{ins.title}</span>
          </div>
          <div className={styles.insightText}>{ins.text}</div>
          <MiniBar bars={ins.bars} />
          {ins.progress != null && <ProgressBar progress={ins.progress} accent={ins.accent} />}
        </div>
      ))}
    </div>
  )
}
