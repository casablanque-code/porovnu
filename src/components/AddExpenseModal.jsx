import { useState } from 'react'
import { DEFAULT_CATEGORIES } from './CategoryFilter'
import styles from './AddExpenseModal.module.css'

const FALLBACK = DEFAULT_CATEGORIES.filter(c => c.id !== 'all')
const DAYS = Array.from({length:31},(_,i)=>i+1)

export default function AddExpenseModal({ onClose, onSave, myName, partnerName, categories, editMode, initialValues }) {
  const cats = (categories && categories.length > 0) ? categories : FALLBACK
  const [amount, setAmount] = useState(initialValues?.amount || '')
  const [title, setTitle] = useState(initialValues?.title || '')
  const [comment, setComment] = useState(initialValues?.comment || '')
  const [category, setCategory] = useState(initialValues?.category || cats[0]?.id || 'food')
  const [paidBy, setPaidBy] = useState(initialValues?.paidBy || 'me')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringDay, setRecurringDay] = useState(1)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!amount || !title) return
    setSaving(true)
    await onSave({
      amount: parseFloat(amount), title, comment: comment.trim()||null,
      category, paidBy, isRecurring, recurringDay: isRecurring ? recurringDay : null,
    })
    setSaving(false)
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.handle}/>
        <div className={styles.title}>{editMode ? 'Редактировать трату' : 'Новая трата'}</div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Сумма, ₽</label>
          <input className={`${styles.input} ${styles.amountInput}`} type="number"
            placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)} autoFocus/>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Название</label>
          <input className={styles.input} type="text"
            placeholder="Продукты, кино, кафе..." value={title} onChange={e=>setTitle(e.target.value)}/>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Категория</label>
          <div className={styles.catGrid}>
            {cats.map(cat => (
              <button key={cat.id} className={`${styles.catBtn} ${category===cat.id?styles.catSel:''}`}
                onClick={() => setCategory(cat.id)} title={cat.label}>
                <span className={styles.catEmoji}>{cat.emoji}</span>
                <span className={styles.catLabel}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Кто платил?</label>
          <div className={styles.whoToggle}>
            <button className={`${styles.whoBtn} ${paidBy==='me'?styles.whoSel:''}`} onClick={()=>setPaidBy('me')}>
              👤 {myName}
            </button>
            <button className={`${styles.whoBtn} ${paidBy==='partner'?styles.whoSel:''}`} onClick={()=>setPaidBy('partner')}>
              👤 {partnerName}
            </button>
          </div>
        </div>

        {/* Comment — optional */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Комментарий <span className={styles.optional}>необязательно</span></label>
          <input className={styles.input} type="text"
            placeholder="Включая чаевые, за прошлую неделю..."
            value={comment} onChange={e=>setComment(e.target.value)} maxLength={100}/>
        </div>

        {/* Recurring — только при создании */}
        {!editMode && <div className={styles.inputGroup}>
          <label className={styles.recurringToggle}>
            <input type="checkbox" checked={isRecurring} onChange={e=>setIsRecurring(e.target.checked)}
              className={styles.checkbox}/>
            <span className={styles.recurringLabel}>🔄 Повторять каждый месяц</span>
          </label>
          {isRecurring && (
            <div className={styles.dayPicker}>
              <div className={styles.dayPickerLabel}>Число месяца:</div>
              <div className={styles.dayGrid}>
                {DAYS.map(d => (
                  <button key={d}
                    className={`${styles.dayBtn} ${recurringDay===d?styles.daySel:''}`}
                    onClick={()=>setRecurringDay(d)}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>}

        <button className={styles.saveBtn} onClick={handleSave} disabled={!amount||!title||saving}>
          {saving ? 'Сохраняем...' : editMode ? 'Сохранить изменения ✓' : 'Сохранить трату ✓'}
        </button>
      </div>
    </div>
  )
}
