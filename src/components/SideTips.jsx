import styles from './SideTips.module.css'

const LEFT_TIPS = [
  { emoji: '💡', title: 'Добавляй сразу', text: 'Чек на кассе — трата в приложении. Не копи до вечера, забудешь сумму.' },
  { emoji: '📊', title: 'Фильтруй по категориям', text: 'Нажми на категорию в списке чтобы увидеть только нужные траты.' },
  { emoji: '🔄', title: 'Повторяющиеся траты', text: 'Аренда, коммуналка, подписки — отметь галочку при создании и трата появится сама.' },
]

function getPartnerEmoji(myGender, partnerGender, mode) {
  if (mode === 'shared') {
    // Общий бюджет — сердечко, эмодзи зависит от пола
    const me = myGender === 'female' ? '👩' : myGender === 'male' ? '👨' : '🧑'
    const them = partnerGender === 'female' ? '👩' : partnerGender === 'male' ? '👨' : '🧑'
    return `${me}❤️${them}`
  }
  // Поровну — два человека без сердца
  const me = myGender === 'female' ? '👩' : myGender === 'male' ? '👨' : '🧑'
  const them = partnerGender === 'female' ? '👩' : partnerGender === 'male' ? '👨' : '🧑'
  return `${me}${them}`
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

export function RightTips({ myName, partnerName, myGender, partnerGender, totalSpent, expenseCount, myTotal, theirTotal, pairMode }) {
  const partnerEmoji = getPartnerEmoji(myGender, partnerGender, pairMode)
  const avgPerExpense = expenseCount > 0 ? Math.round(totalSpent / expenseCount) : 0
  const myShare = totalSpent > 0 ? Math.round(myTotal / totalSpent * 100) : 50
  const modeLabel = pairMode === 'shared' ? 'Общий бюджет' : 'Поровну'

  return (
    <div className={styles.side}>
      {/* Динамическая карточка пары */}
      <div className={`${styles.tip} ${styles.tipHighlight}`}>
        <div className={styles.tipEmoji}>{partnerEmoji}</div>
        <div className={styles.tipTitle}>{myName} и {partnerName}</div>
        <div className={styles.tipText}>Режим: {modeLabel}</div>
      </div>

      {/* Статистика если есть траты */}
      {totalSpent > 0 && (
        <div className={styles.tip}>
          <div className={styles.tipEmoji}>📈</div>
          <div className={styles.tipTitle}>Этот месяц</div>
          <div className={styles.tipText}>
            {expenseCount} трат на ₽{Math.round(totalSpent).toLocaleString('ru')}<br/>
            Средняя трата: ₽{avgPerExpense.toLocaleString('ru')}<br/>
            {myName}: {myShare}% расходов
          </div>
        </div>
      )}

      <div className={styles.tip}>
        <div className={styles.tipEmoji}>⚙️</div>
        <div className={styles.tipTitle}>Настройки</div>
        <div className={styles.tipText}>Смени режим, посмотри историю и аналитику, закрой месяц.</div>
      </div>

      <div className={styles.tip}>
        <div className={styles.tipEmoji}>🔒</div>
        <div className={styles.tipTitle}>Приватно</div>
        <div className={styles.tipText}>Данные видит только твой партнёр. Никто больше.</div>
      </div>
    </div>
  )
}
