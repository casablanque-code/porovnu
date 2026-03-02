import styles from './HistoryChart.module.css'

function getWeekData(expenses, userId) {
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
  const now = new Date()
  const result = days.map((label, i) => {
    const d = new Date(now)
    const dayOfWeek = now.getDay() || 7
    d.setDate(now.getDate() - (dayOfWeek - 1) + i)
    const dateStr = d.toDateString()
    const dayExpenses = expenses.filter(e => new Date(e.created_at).toDateString() === dateStr)
    return {
      label,
      mine: dayExpenses.filter(e => e.paid_by === userId).reduce((s,e) => s + Number(e.amount), 0),
      theirs: dayExpenses.filter(e => e.paid_by !== userId).reduce((s,e) => s + Number(e.amount), 0),
    }
  })
  return result
}

function getMonthData(expenses, userId) {
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  // Group by week within month
  const weeks = [1,2,3,4].map(w => {
    const start = (w - 1) * 7 + 1
    const end = Math.min(w * 7, daysInMonth)
    const weekExpenses = expenses.filter(e => {
      const d = new Date(e.created_at)
      if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) return false
      return d.getDate() >= start && d.getDate() <= end
    })
    return {
      label: `${start}-${end}`,
      mine: weekExpenses.filter(e => e.paid_by === userId).reduce((s,e) => s + Number(e.amount), 0),
      theirs: weekExpenses.filter(e => e.paid_by !== userId).reduce((s,e) => s + Number(e.amount), 0),
    }
  })
  return weeks
}

function getYearData(expenses, userId) {
  const months = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']
  const now = new Date()
  return months.map((label, i) => {
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.created_at)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === i
    })
    return {
      label,
      mine: monthExpenses.filter(e => e.paid_by === userId).reduce((s,e) => s + Number(e.amount), 0),
      theirs: monthExpenses.filter(e => e.paid_by !== userId).reduce((s,e) => s + Number(e.amount), 0),
    }
  })
}

export default function HistoryChart({ expenses, period, userId }) {
  const data = period === 'week' ? getWeekData(expenses, userId)
    : period === 'month' ? getMonthData(expenses, userId)
    : getYearData(expenses, userId)

  const maxVal = Math.max(...data.map(d => d.mine + d.theirs), 1)
  const totalSpent = data.reduce((s, d) => s + d.mine + d.theirs, 0)
  const myTotal = data.reduce((s, d) => s + d.mine, 0)

  if (totalSpent === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyEmoji}>📊</div>
        <div className={styles.emptyText}>Нет трат за этот период</div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <div className={styles.dot} style={{ background: '#C96A3A' }} />
          <span>Я: ₽{Math.round(myTotal).toLocaleString('ru')}</span>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.dot} style={{ background: '#8BA888' }} />
          <span>Партнёр: ₽{Math.round(totalSpent - myTotal).toLocaleString('ru')}</span>
        </div>
        <div className={styles.summaryTotal}>
          Итого: ₽{Math.round(totalSpent).toLocaleString('ru')}
        </div>
      </div>

      {/* Bars */}
      <div className={styles.chart}>
        {data.map((d, i) => {
          const total = d.mine + d.theirs
          const heightPct = (total / maxVal) * 100
          const myPct = total > 0 ? (d.mine / total) * 100 : 50

          return (
            <div key={i} className={styles.barCol}>
              <div className={styles.barWrap}>
                {total > 0 && (
                  <div className={styles.bar} style={{ height: `${heightPct}%` }}>
                    <div className={styles.barMine} style={{ height: `${myPct}%` }} />
                    <div className={styles.barTheirs} style={{ height: `${100 - myPct}%` }} />
                  </div>
                )}
              </div>
              <div className={styles.barLabel}>{d.label}</div>
              {total > 0 && (
                <div className={styles.barVal}>₽{Math.round(total / 1000) > 0 ? Math.round(total/1000)+'к' : Math.round(total)}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
