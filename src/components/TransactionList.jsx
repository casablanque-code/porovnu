import { useState, useRef, useEffect } from 'react'
import { DEFAULT_CATEGORIES, CatIcon } from './CategoryFilter'
import styles from './TransactionList.module.css'

const CATEGORY_COLORS = {
  food: '#FEE9D1', home: '#D6EDD4', fun: '#FFE0E0',
  transport: '#E0EAFF', health: '#F0E0FF', cafe: '#FFF0D6', other: '#E8E8E8'
}
const CATS = DEFAULT_CATEGORIES.filter(c => c.id !== 'all')

// ─── Swipeable card wrapper ───────────────────────────────────────────────────
function SwipeItem({ onSwipeLeft, onSwipeRight, children }) {
  const ref      = useRef(null)
  const gesture  = useRef({ active: false, startX: 0, startY: 0, dx: 0, axis: null })
  const [dx, setDx] = useState(0)          // текущее смещение карточки
  const [action, setAction] = useState(null) // 'delete' | 'edit' | null — подложка

  const THRESHOLD = 72   // px — минимум для срабатывания

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onStart = (e) => {
      const t = e.touches[0]
      gesture.current = { active: true, startX: t.clientX, startY: t.clientY, dx: 0, axis: null }
    }

    const onMove = (e) => {
      if (!gesture.current.active) return
      const t  = e.touches[0]
      const dX = t.clientX - gesture.current.startX
      const dY = t.clientY - gesture.current.startY

      // Определяем ось при первом значимом движении
      if (!gesture.current.axis) {
        if (Math.abs(dX) < 4 && Math.abs(dY) < 4) return
        gesture.current.axis = Math.abs(dX) > Math.abs(dY) ? 'x' : 'y'
      }

      // Вертикальный свайп — не трогаем, пусть скроллится список
      if (gesture.current.axis === 'y') return

      // Горизонтальный — блокируем скролл и двигаем карточку
      e.preventDefault()
      gesture.current.dx = dX

      // Сопротивление: после THRESHOLD карточка двигается медленнее
      const raw  = dX
      const sign = raw < 0 ? -1 : 1
      const abs  = Math.abs(raw)
      const clamped = abs < THRESHOLD ? abs : THRESHOLD + (abs - THRESHOLD) * 0.25
      const final = sign * Math.min(clamped, THRESHOLD * 1.6)

      setDx(final)
      setAction(final < -12 ? 'delete' : final > 12 ? 'edit' : null)
    }

    const onEnd = () => {
      if (!gesture.current.active) return
      gesture.current.active = false
      const finalDx = gesture.current.dx

      if (finalDx < -THRESHOLD) {
        // Свайп влево — удалить: анимируем уход влево, потом колбэк
        setDx(-300)
        setTimeout(() => { onSwipeLeft(); setDx(0); setAction(null) }, 260)
      } else if (finalDx > THRESHOLD) {
        // Свайп вправо — редактировать
        setDx(0); setAction(null)
        onSwipeRight()
      } else {
        // Недостаточно — пружина назад
        setDx(0); setAction(null)
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove',  onMove,  { passive: false })
    el.addEventListener('touchend',   onEnd,   { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove',  onMove)
      el.removeEventListener('touchend',   onEnd)
    }
  }, [onSwipeLeft, onSwipeRight])

  return (
    <div className={styles.swipeWrap} ref={ref}>
      {/* Подложки */}
      <div className={`${styles.backdrop} ${styles.backdropDelete}`}
        style={{ opacity: action === 'delete' ? Math.min(Math.abs(dx) / THRESHOLD, 1) : 0 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
      </div>
      <div className={`${styles.backdrop} ${styles.backdropEdit}`}
        style={{ opacity: action === 'edit' ? Math.min(dx / THRESHOLD, 1) : 0 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </div>

      {/* Сама карточка */}
      <div
        className={styles.swipeCard}
        style={{
          transform: `translateX(${dx}px)`,
          transition: gesture.current.active ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.2,0.64,1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Inline edit form ─────────────────────────────────────────────────────────
function InlineEditForm({ exp, userId, myName, partnerName, allCategories, onSave, onCancel }) {
  const cats = (allCategories && allCategories.length > 0)
    ? allCategories.filter(c => c.id !== 'all')
    : CATS

  const [amount,   setAmount]   = useState(String(exp.amount))
  const [title,    setTitle]    = useState(exp.title)
  const [comment,  setComment]  = useState(exp.comment || '')
  const [category, setCategory] = useState(exp.category)
  const [paidBy,   setPaidBy]   = useState(exp.paid_by === userId ? 'me' : 'partner')
  const [saving,   setSaving]   = useState(false)

  const handleAmount = (e) => {
    const v = e.target.value.replace(',', '.')
    if (/^\d*\.?\d*$/.test(v)) setAmount(v)
  }

  const handleSave = async () => {
    if (!amount || !title || !category) return
    setSaving(true)
    await onSave({ amount: parseFloat(amount), title, comment: comment.trim() || null, category, paidBy })
    setSaving(false)
  }

  return (
    <div className={styles.editForm}>
      {/* Сумма */}
      <div className={styles.efRow}>
        <div className={styles.efField}>
          <div className={styles.efLabel}>Сумма, ₽</div>
          <input className={`${styles.efInput} ${styles.efAmount}`}
            type="text" inputMode="decimal" value={amount} onChange={handleAmount} />
        </div>
        <div className={`${styles.efField} ${styles.efFieldFlex}`}>
          <div className={styles.efLabel}>Название</div>
          <input className={styles.efInput} type="text" value={title}
            onChange={e => setTitle(e.target.value)} placeholder="Название" />
        </div>
      </div>

      {/* Категории */}
      <div className={styles.efLabel} style={{marginBottom:6}}>Категория</div>
      <div className={styles.efCatGrid}>
        {cats.map(cat => (
          <button key={cat.id}
            className={`${styles.efCatBtn} ${category === cat.id ? styles.efCatSel : ''}`}
            onClick={() => setCategory(cat.id)}>
            <CatIcon icon={cat.icon} emoji={cat.emoji} size={15}
              color={category === cat.id ? 'var(--terracotta)' : 'var(--brown-light)'} />
            <span className={styles.efCatLabel}>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Кто платил */}
      <div className={styles.efLabel} style={{marginBottom:6}}>Кто платил?</div>
      <div className={styles.efWhoRow}>
        <button className={`${styles.efWhoBtn} ${paidBy === 'me' ? styles.efWhoSel : ''}`}
          onClick={() => setPaidBy('me')}>👤 {myName}</button>
        <button className={`${styles.efWhoBtn} ${paidBy === 'partner' ? styles.efWhoSel : ''}`}
          onClick={() => setPaidBy('partner')}>👤 {partnerName}</button>
      </div>

      {/* Комментарий */}
      <div className={styles.efLabel} style={{marginBottom:6}}>
        Комментарий <span className={styles.efOptional}>необязательно</span>
      </div>
      <input className={styles.efInput} type="text" value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="За прошлую неделю, включая чаевые..." maxLength={100} />

      {/* Кнопки */}
      <div className={styles.efActions}>
        <button className={styles.efCancel} onClick={onCancel}>Отмена</button>
        <button className={styles.efSave}
          onClick={handleSave}
          disabled={!amount || !title || !category || saving}>
          {saving ? 'Сохраняем...' : 'Сохранить ✓'}
        </button>
      </div>
    </div>
  )
}

// ─── Transaction item ─────────────────────────────────────────────────────────
function TransactionItem({ exp, userId, partnerId, myName, partnerName, myGender, partnerGender, allCategories, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false)

  const isPaidByMe = exp.paid_by === userId
  const cats       = (allCategories && allCategories.length > 0) ? allCategories : CATS
  const cat        = cats.find(c => c.id === exp.category)
  const icon       = cat?.icon || cat?.emoji || 'Package'
  const catColor   = CATEGORY_COLORS[exp.category] || '#E8E8E8'

  const date    = new Date(exp.created_at)
  const isToday = new Date().toDateString() === date.toDateString()
  const dateStr = isToday
    ? `Сегодня, ${date.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleDateString('ru', { day: 'numeric', month: 'long' })

  async function handleSave(updates) {
    await onEdit(exp.id, {
      title:    updates.title,
      amount:   updates.amount,
      category: updates.category,
      comment:  updates.comment || null,
      paid_by:  updates.paidBy === 'me' ? userId : partnerId,
    })
    setEditing(false)
  }

  const card = (
    <div className={`${styles.item} ${isPaidByMe ? styles.itemMe : styles.itemThem} ${editing ? styles.itemEditing : ''}`}>
      {!editing ? (
        // ── Обычный вид ──
        <>
          <div className={styles.emoji} style={{ background: catColor }}>
          <CatIcon icon={cat?.icon} emoji={cat?.emoji} size={20} color="var(--brown)" strokeWidth={1.6} />
        </div>
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
        </>
      ) : (
        // ── Inline редактирование ──
        <InlineEditForm
          exp={exp}
          userId={userId}
          myName={myName}
          partnerName={partnerName}
          allCategories={allCategories}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )

  // В режиме редактирования свайпы отключаем
  if (editing) return card

  return (
    <SwipeItem
      onSwipeLeft={() => onDelete(exp.id, exp)}
      onSwipeRight={() => setEditing(true)}
    >
      {card}
    </SwipeItem>
  )
}

// ─── List ─────────────────────────────────────────────────────────────────────
export default function TransactionList({ expenses, userId, partnerId, myName, partnerName, myGender, partnerGender, allCategories, onDelete, onEdit }) {
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
            partnerId={partnerId}
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
