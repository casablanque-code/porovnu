import { useState } from 'react'
import AddExpenseModal from './AddExpenseModal'
import styles from './TransactionList.module.css'

const CATEGORY_COLORS = {
  food: '#FEE9D1', home: '#D6EDD4', fun: '#FFE0E0',
  transport: '#E0EAFF', health: '#F0E0FF', cafe: '#FFF0D6', other: '#E8E8E8'
}

function TransactionItem({ exp, userId, myName, partnerName, myGender, partnerGender, allCategories, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false)

  const isPaidByMe = exp.paid_by === userId
  const cat = allCategories?.find(c => c.id === exp.category)
  const emoji = cat?.emoji || '📦'
  const color = CATEGORY_COLORS[exp.category] || '#E8E8E8'

  const date = new Date(exp.created_at)
  const isToday = new Date().toDateString() === date.toDateString()
  const dateStr = isToday
    ? `Сегодня, ${date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleDateString('ru', { day: 'numeric', month: 'long' })

  async function handleSaveEdit(updates) {
    await onEdit(exp.id, {
      title: updates.title,
      amount: updates.amount,
      category: updates.category,
      comment: updates.comment || null,
      paid_by: updates.paidBy === 'me' ? userId : exp.paid_by, // сохраняем id партнёра
    })
    setEditing(false)
  }

  return (
    <>
      <div className={`${styles.item} ${isPaidByMe ? styles.itemMe : styles.itemThem}`}>
        <div className={styles.emoji} style={{ background: color }}>{emoji}</div>
        <div className={styles.info}>
          <div className={styles.name}>{exp.title}</div>
          {exp.comment && <div className={styles.comment}>{exp.comment}</div>}
          <div className={styles.meta}>
            {dateStr}
            {exp.is_recurring && <span className={styles.recurringBadge}>🔄</span>}
          </div>
        </div>
        <div className={styles.amountBlock}>
          <div className={styles.amount}>₽ {Number(exp.amount).toLocaleString('ru')}</div>
          <div className={`${styles.who} ${isPaidByMe ? styles.whoMe : styles.whoThem}`}>
            {isPaidByMe
              ? `платил${myGender === 'female' ? 'а' : ''} ${myName}`
              : `платил${partnerGender === 'female' ? 'а' : ''} ${partnerName}`}
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.editBtn} onClick={() => setEditing(true)} title="Редактировать">✏️</button>
          <button className={styles.deleteBtn} onClick={() => onDelete(exp.id)} title="Удалить">🗑</button>
        </div>
      </div>

      {/* Полная модалка редактирования */}
      {editing && (
        <AddExpenseModal
          onClose={() => setEditing(false)}
          onSave={handleSaveEdit}
          myName={myName}
          partnerName={partnerName}
          categories={allCategories}
          editMode
          initialValues={{
            title: exp.title,
            amount: String(exp.amount),
            category: exp.category,
            comment: exp.comment || '',
            paidBy: isPaidByMe ? 'me' : 'partner',
          }}
        />
      )}
    </>
  )
}

export default function TransactionList({ expenses, userId, myName, partnerName, myGender, partnerGender, allCategories, onDelete, onEdit }) {
  if (expenses.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyEmoji}>🧾</div>
        <div className={styles.emptyText}>Пока нет трат</div>
        <div className={styles.emptySub}>Добавь первую трату кнопкой снизу</div>
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>Последние траты</div>
        <div className={styles.count}>{expenses.length} шт.</div>
      </div>
      <div className={styles.list}>
        {expenses.map(exp => (
          <TransactionItem
            key={exp.id}
            exp={exp}
            userId={userId}
            myName={myName}
            partnerName={partnerName}
            myGender={myGender}
            partnerGender={partnerGender}
            allCategories={allCategories}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  )
}
