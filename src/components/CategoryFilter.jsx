import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  ShoppingCart, Home, Coffee, Car, Heart, Music, Package,
  Dumbbell, Plane, Train, Book, Laptop, Camera, Shirt,
  Scissors, Wrench, Gamepad2, Globe, Dog, Leaf, Palette,
  Gift, Utensils, Wine, Headphones, Bike, Baby, Zap, Wallet, X
} from 'lucide-react'
import styles from './CategoryFilter.module.css'

export const ICON_MAP = {
  ShoppingCart, Home, Coffee, Car, Heart, Music, Package,
  Dumbbell, Plane, Train, Book, Laptop, Camera, Shirt,
  Scissors, Wrench, Gamepad2, Globe, Dog, Leaf, Palette,
  Gift, Utensils, Wine, Headphones, Bike, Baby, Zap, Wallet
}

export const ICON_PICKER = [
  { name: 'Dumbbell',     label: 'Спорт' },
  { name: 'Plane',        label: 'Путешествия' },
  { name: 'Train',        label: 'Транспорт' },
  { name: 'Bike',         label: 'Велосипед' },
  { name: 'Utensils',     label: 'Еда' },
  { name: 'Coffee',       label: 'Кафе' },
  { name: 'Wine',         label: 'Бар' },
  { name: 'Gift',         label: 'Подарки' },
  { name: 'Home',         label: 'Жильё' },
  { name: 'Wrench',       label: 'Ремонт' },
  { name: 'Scissors',     label: 'Красота' },
  { name: 'Shirt',        label: 'Одежда' },
  { name: 'Laptop',       label: 'Техника' },
  { name: 'Headphones',   label: 'Музыка' },
  { name: 'Gamepad2',     label: 'Игры' },
  { name: 'Camera',       label: 'Фото' },
  { name: 'Book',         label: 'Книги' },
  { name: 'Palette',      label: 'Творчество' },
  { name: 'Heart',        label: 'Здоровье' },
  { name: 'Baby',         label: 'Дети' },
  { name: 'Dog',          label: 'Питомцы' },
  { name: 'Leaf',         label: 'Экология' },
  { name: 'Globe',        label: 'Интернет' },
  { name: 'Zap',          label: 'Коммуналка' },
  { name: 'Wallet',       label: 'Финансы' },
  { name: 'Music',        label: 'Концерты' },
  { name: 'ShoppingCart', label: 'Покупки' },
  { name: 'Package',      label: 'Другое' },
]

export const DEFAULT_CATEGORIES = [
  { id: 'all',       label: 'Все',        icon: 'Package' },
  { id: 'food',      label: 'Продукты',   icon: 'ShoppingCart' },
  { id: 'home',      label: 'Жильё',      icon: 'Home' },
  { id: 'cafe',      label: 'Кафе',       icon: 'Coffee' },
  { id: 'transport', label: 'Транспорт',  icon: 'Car' },
  { id: 'health',    label: 'Здоровье',   icon: 'Heart' },
  { id: 'fun',       label: 'Досуг',      icon: 'Music' },
  { id: 'other',     label: 'Другое',     icon: 'Package' },
]

export function CatIcon({ icon, emoji, size = 16, color = 'currentColor', strokeWidth = 1.75 }) {
  if (!icon && emoji) return <span style={{ fontSize: size }}>{emoji}</span>
  const Comp = ICON_MAP[icon]
  if (!Comp) return <span style={{ fontSize: size }}>□</span>
  return <Comp size={size} color={color} strokeWidth={strokeWidth} />
}

// Хранилище оверрайдов дефолтных категорий в паре
// id вида 'default_food' → { label, icon }
const DEFAULT_IDS = new Set(['all','food','home','cafe','transport','health','fun','other'])

const MAX_TOTAL = 14

export default function CategoryFilter({ active, onChange, pairId, onCategoriesChange }) {
  const [custom, setCustom]           = useState([])
  const [defaultOverrides, setDefaultOverrides] = useState({}) // { food: {label,icon}, ... }
  const [adding, setAdding]           = useState(false)
  const [editing, setEditing]         = useState(null)  // { id, label, icon, isDefault }
  const [newLabel, setNewLabel]       = useState('')
  const [newIcon, setNewIcon]         = useState('Package')
  const [step, setStep]               = useState('label')
  const [wiggle, setWiggle]           = useState(false)
  const longPressTimer                = useRef(null)
  const wrapRef                       = useRef(null)

  useEffect(() => { if (pairId) loadAll() }, [pairId])

  async function loadAll() {
    // Загружаем кастомные категории
    const { data: cats } = await supabase.from('pair_categories').select('*')
      .eq('pair_id', pairId).order('created_at')

    // Отделяем оверрайды дефолтных от кастомных
    const overrides = {}
    const cust = []
    ;(cats || []).forEach(d => {
      if (d.default_id) {
        overrides[d.default_id] = { label: d.label, icon: d.emoji, dbId: d.id }
      } else {
        cust.push({ id: d.id, label: d.label, icon: d.emoji })
      }
    })
    setDefaultOverrides(overrides)
    setCustom(cust)
    broadcastCategories(overrides, cust)
  }

  function broadcastCategories(overrides, cust) {
    const defaults = DEFAULT_CATEGORIES.filter(c => c.id !== 'all').map(c => ({
      ...c,
      label: overrides[c.id]?.label ?? c.label,
      icon:  overrides[c.id]?.icon  ?? c.icon,
    }))
    onCategoriesChange?.([...defaults, ...cust])
  }

  // ── Long press ──
  function startLongPress(e) {
    // Предотвращаем выделение текста
    e.preventDefault()
    longPressTimer.current = setTimeout(() => setWiggle(true), 500)
  }
  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  // Клик вне grid — выходим из wiggle
  useEffect(() => {
    if (!wiggle) return
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setWiggle(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [wiggle])

  // ── Delete ──
  async function handleDelete(cat, isDefault) {
    if (isDefault) {
      // Удаляем оверрайд если есть, восстанавливаем дефолт
      const ov = defaultOverrides[cat.id]
      if (ov?.dbId) {
        await supabase.from('pair_categories').delete().eq('id', ov.dbId)
      }
      const newOv = { ...defaultOverrides }
      delete newOv[cat.id]
      setDefaultOverrides(newOv)
      broadcastCategories(newOv, custom)
    } else {
      await supabase.from('pair_categories').delete().eq('id', cat.id)
      const updated = custom.filter(c => c.id !== cat.id)
      setCustom(updated)
      broadcastCategories(defaultOverrides, updated)
    }
  }

  // ── Edit ──
  function openEdit(cat, isDefault) {
    const currentLabel = isDefault
      ? (defaultOverrides[cat.id]?.label ?? cat.label)
      : cat.label
    const currentIcon = isDefault
      ? (defaultOverrides[cat.id]?.icon ?? cat.icon)
      : cat.icon
    setEditing({ id: cat.id, label: currentLabel, icon: currentIcon, isDefault })
    setNewLabel(currentLabel)
    setNewIcon(currentIcon)
    setStep('label')
    setAdding(false)
  }

  async function handleSaveEdit() {
    const label = newLabel.trim()
    if (!label) return
    const { id, isDefault } = editing

    if (isDefault) {
      const existing = defaultOverrides[id]
      if (existing?.dbId) {
        await supabase.from('pair_categories').update({ label, emoji: newIcon }).eq('id', existing.dbId)
      } else {
        await supabase.from('pair_categories').insert({ pair_id: pairId, label, emoji: newIcon, default_id: id })
      }
      const newOv = { ...defaultOverrides, [id]: { label, icon: newIcon, dbId: existing?.dbId } }
      if (!existing?.dbId) {
        // Получим новый id
        const { data } = await supabase.from('pair_categories').select('id').eq('pair_id', pairId).eq('default_id', id).single()
        if (data) newOv[id].dbId = data.id
      }
      setDefaultOverrides(newOv)
      broadcastCategories(newOv, custom)
    } else {
      await supabase.from('pair_categories').update({ label, emoji: newIcon }).eq('id', id)
      const updated = custom.map(c => c.id === id ? { ...c, label, icon: newIcon } : c)
      setCustom(updated)
      broadcastCategories(defaultOverrides, updated)
    }
    setEditing(null)
    setNewLabel(''); setNewIcon('Package'); setStep('label')
  }

  // ── Add ──
  const canAdd = (DEFAULT_CATEGORIES.length - 1 + custom.length) < MAX_TOTAL

  async function handleAdd() {
    const label = newLabel.trim()
    if (!label || !pairId) return
    const { data, error } = await supabase
      .from('pair_categories').insert({ pair_id: pairId, label, emoji: newIcon }).select().single()
    if (!error && data) {
      const newCat = { id: data.id, label: data.label, icon: data.emoji }
      const updated = [...custom, newCat]
      setCustom(updated)
      broadcastCategories(defaultOverrides, updated)
    }
    setNewLabel(''); setNewIcon('Package'); setStep('label'); setAdding(false)
  }

  function cancelEditing() {
    setEditing(null); setAdding(false); setNewLabel(''); setNewIcon('Package'); setStep('label')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      if (step === 'label' && newLabel.trim()) setStep('icon')
      else if (step === 'icon') editing ? handleSaveEdit() : handleAdd()
    }
    if (e.key === 'Escape') cancelEditing()
  }

  // Категории с учётом оверрайдов
  const allCategories = [
    ...DEFAULT_CATEGORIES.map(c => c.id === 'all' ? c : {
      ...c,
      label: defaultOverrides[c.id]?.label ?? c.label,
      icon:  defaultOverrides[c.id]?.icon  ?? c.icon,
    }),
    ...custom,
  ]

  const panelOpen = adding || !!editing

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div
        className={styles.grid}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
      >
        {allCategories.map(cat => {
          const isDefault = DEFAULT_IDS.has(cat.id)
          const isWiggling = wiggle && cat.id !== 'all'
          const isEditing  = editing?.id === cat.id

          return (
            <div key={cat.id} className={`${styles.pillWrap} ${isWiggling ? styles.wiggling : ''}`}>
              <button
                className={`${styles.pill} ${active === cat.id && !wiggle ? styles.active : ''} ${isEditing ? styles.editingPill : ''}`}
                onClick={() => {
                  if (wiggle && cat.id !== 'all') { openEdit(cat, isDefault); return }
                  if (!wiggle) onChange(cat.id)
                }}
              >
                <CatIcon icon={cat.icon} emoji={cat.emoji} size={14}
                  color={active === cat.id && !wiggle ? 'white' : isEditing ? 'var(--terracotta)' : 'var(--brown-light)'} />
                {cat.label}
              </button>
              {wiggle && cat.id !== 'all' && (
                <button className={styles.deleteX}
                  onClick={e => { e.stopPropagation(); handleDelete(cat, isDefault) }}>
                  <X size={10} strokeWidth={3} color="white"/>
                </button>
              )}
            </div>
          )
        })}
        {canAdd && !panelOpen && !wiggle && (
          <button className={`${styles.pill} ${styles.addBtn}`} onClick={() => setAdding(true)}>
            + своя
          </button>
        )}
        {wiggle && (
          <button className={`${styles.pill} ${styles.doneBtn}`} onClick={() => setWiggle(false)}>
            Готово
          </button>
        )}
      </div>

      {/* Панель добавления / редактирования */}
      {panelOpen && (
        <div className={styles.addPanel}>
          {step === 'label' ? (
            <>
              <div className={styles.addHint}>
                {editing ? `Редактировать «${editing.label}»` : 'Название категории'}
              </div>
              <div className={styles.inputRow}>
                <input className={styles.input} autoFocus
                  placeholder="Зал, Подписки, Спорт..."
                  value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={handleKeyDown} maxLength={16} />
                <button className={styles.nextBtn2}
                  onClick={() => newLabel.trim() && setStep('icon')}
                  disabled={!newLabel.trim()}>
                  Далее →
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.addHint}>
                <span className={styles.chosenIcon}>
                  <CatIcon icon={newIcon} size={18} color="var(--terracotta)" />
                </span>
                Иконка для «{newLabel}»
              </div>
              <div className={styles.iconGrid}>
                {ICON_PICKER.map(({ name, label }) => (
                  <button key={name} title={label}
                    className={`${styles.iconBtn} ${newIcon === name ? styles.iconSel : ''}`}
                    onClick={() => setNewIcon(name)}>
                    <CatIcon icon={name} size={20}
                      color={newIcon === name ? 'var(--terracotta)' : 'var(--brown-light)'}
                      strokeWidth={newIcon === name ? 2 : 1.75} />
                  </button>
                ))}
              </div>
              <div className={styles.emojiActions}>
                <button className={styles.backBtn} onClick={() => setStep('label')}>Назад</button>
                <button className={styles.nextBtn} onClick={editing ? handleSaveEdit : handleAdd}>
                  {editing ? 'Сохранить ✓' : 'Добавить ✓'}
                </button>
              </div>
            </>
          )}
          <button className={styles.cancelLink} onClick={cancelEditing}>отмена</button>
        </div>
      )}
    </div>
  )
}
