import { useState } from 'react'
import styles from './BalanceCard.module.css'

const SBP_BANKS = [
  { name: 'Сбер', url: (phone, amount) => `https://www.sberbank.com/ru/person/sberpay/pay?phone=${phone}&amount=${amount}` },
  { name: 'Тинькофф', url: (phone, amount) => `https://www.tinkoff.ru/transfer/phone/?phoneNumber=${phone}&amount=${amount}` },
  { name: 'ВТБ', url: (phone, amount) => `https://online.vtb.ru/transfers/by-phone?phone=${phone}&amount=${amount}` },
]

export default function BalanceCard({ balance, totalSpent, myName, partnerName, myGender, myTotal, theirTotal, mode, partnerPhone }) {
  const [showSbp, setShowSbp] = useState(false)
  const [phone, setPhone] = useState(partnerPhone || '')
  const [copied, setCopied] = useState(false)

  const iOwe = balance < 0
  const amount = Math.abs(balance)
  const isSharedMode = mode === 'shared'

  // Shared mode — просто показываем траты без баланса
  if (isSharedMode) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.label}>Общий бюджет</div>
          <div className={styles.amount}>₽ {Math.round(totalSpent).toLocaleString('ru')}</div>
          <div className={styles.sub}>потрачено вместе в этом месяце</div>
          <div className={styles.splitRow}>
            <div className={styles.splitItem}>
              <div className={styles.splitDot} style={{ background: 'rgba(255,255,255,0.9)' }} />
              <span>{myName}: ₽ {Math.round(myTotal).toLocaleString('ru')}</span>
            </div>
            <div className={styles.splitItem}>
              <div className={styles.splitDot} style={{ background: 'rgba(255,255,255,0.5)' }} />
              <span>{partnerName}: ₽ {Math.round(theirTotal).toLocaleString('ru')}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Split mode — показываем кто кому должен
  const handleCopySbp = async () => {
    const text = `Привет! Переведи мне ₽${Math.round(amount).toLocaleString('ru')} по СБП: ${phone}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.label}>
          {amount < 1
            ? '🎉 Всё поровну!'
            : iOwe
              ? `${myName} должн${myGender === 'male' ? 'ен' : 'а'} ${partnerName}`
              : `${partnerName} должен ${myName}`
          }
        </div>
        <div className={styles.amount}>
          ₽ {amount < 1 ? '0' : Math.round(amount).toLocaleString('ru')}
        </div>
        <div className={styles.sub}>
          из общих трат <strong>₽ {Math.round(totalSpent).toLocaleString('ru')}</strong> в этом месяце
        </div>

        {amount >= 1 && (
          <div className={styles.splitRow}>
            <div className={styles.splitItem}>
              <div className={styles.splitDot} style={{ background: 'rgba(255,255,255,0.9)' }} />
              <span>{myName}: ₽ {Math.round(myTotal).toLocaleString('ru')}</span>
            </div>
            <div className={styles.splitItem}>
              <div className={styles.splitDot} style={{ background: 'rgba(255,255,255,0.5)' }} />
              <span>{partnerName}: ₽ {Math.round(theirTotal).toLocaleString('ru')}</span>
            </div>
          </div>
        )}

        {amount >= 1 && (
          <button className={styles.settleBtn} onClick={() => setShowSbp(!showSbp)}>
            {iOwe ? 'Рассчитаться →' : 'Запросить расчёт →'}
          </button>
        )}
      </div>

      {/* СБП панель */}
      {showSbp && amount >= 1 && (
        <div className={styles.sbpPanel}>
          <div className={styles.sbpTitle}>
            {iOwe
              ? `Переведи ₽${Math.round(amount).toLocaleString('ru')} по СБП`
              : `Попроси ${partnerName} перевести ₽${Math.round(amount).toLocaleString('ru')}`
            }
          </div>

          <div className={styles.phoneRow}>
            <input
              className={styles.phoneInput}
              placeholder="Номер телефона получателя"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              type="tel"
            />
          </div>

          {phone && (
            <div className={styles.sbpBanks}>
              {SBP_BANKS.map(bank => (
                <a
                  key={bank.name}
                  href={bank.url(phone.replace(/\D/g,''), Math.round(amount))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.bankBtn}
                >
                  {bank.name}
                </a>
              ))}
            </div>
          )}

          <button className={styles.copyBtn} onClick={handleCopySbp}>
            {copied ? '✓ Скопировано' : '📋 Скопировать сообщение'}
          </button>
        </div>
      )}
    </div>
  )
}
