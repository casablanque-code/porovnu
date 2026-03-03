import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AddExpenseModal from '../components/AddExpenseModal'
import BalanceCard from '../components/BalanceCard'
import TransactionList from '../components/TransactionList'
import InviteBanner from '../components/InviteBanner'
import CategoryFilter from '../components/CategoryFilter'
import { LeftTips, RightTips } from '../components/SideTips'
import { useRealtimeExpenses } from '../hooks/useRealtimeExpenses'
import { useToast } from '../components/Toast'
import InsightCards from '../components/InsightCards'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [recurringDue, setRecurringDue] = useState([])
  const [pair, setPair] = useState(null)
  const [partner, setPartner] = useState(null)
  const [myProfile, setMyProfile] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [allCategories, setAllCategories] = useState([])
  const [pairMode, setPairMode] = useState('split')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [user])

  // Realtime — обновляем траты когда партнёр что-то добавил
  useRealtimeExpenses(pair?.id, () => pair && loadExpenses(pair.id))

  // Realtime — обновляем режим когда партнёр его меняет
  useEffect(() => {
    if (!pair) return
    const channel = supabase
      .channel(`pair_mode:${pair.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pairs', filter: `id=eq.${pair.id}` },
        (payload) => { if (payload.new?.mode) setPairMode(payload.new.mode) })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [pair?.id])

  async function loadData() {
    setLoading(true)
    await Promise.all([loadProfile(), loadPair()])
    setLoading(false)
  }

  async function checkRecurring(pairId) {
    const today = new Date().getDate()
    const { data } = await supabase.from('recurring_templates')
      .select('*').eq('pair_id', pairId)
    const due = (data||[]).filter(t => t.recurring_day === today)
    if (due.length > 0) setRecurringDue(due)
  }

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) setMyProfile(data)
  }

  async function loadPair() {
    const { data: pairData } = await supabase
      .from('pairs')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single()

    if (!pairData) return
    setPair(pairData)
    setPairMode(pairData.mode || 'split')

    const partnerId = pairData.user1_id === user.id ? pairData.user2_id : pairData.user1_id
    if (partnerId) {
      const { data: partnerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single()
      if (partnerData) setPartner(partnerData)
    }

    await loadExpenses(pairData.id)
    await checkRecurring(pairData.id)
  }

  async function loadExpenses(pairId) {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('pair_id', pairId)
      .gte('created_at', firstDay)
      .order('created_at', { ascending: false })
    setExpenses(data || [])
  }

  async function handleDeleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) toast('Ошибка при удалении', 'error')
    else { toast('Удалено', 'info'); await loadExpenses(pair.id) }
  }

  async function handleEditExpense(id, updates) {
    const { error } = await supabase.from('expenses').update(updates).eq('id', id)
    if (error) toast('Ошибка при сохранении', 'error')
    else { toast('Сохранено ✓', 'success'); await loadExpenses(pair.id) }
  }

  async function handleAddExpense(expense) {
    const payload = {
      pair_id: pair.id,
      paid_by: expense.paidBy === 'me' ? user.id : partner?.id,
      amount: expense.amount,
      title: expense.title,
      category: expense.category,
      comment: expense.comment || null,
      is_recurring: expense.isRecurring || false,
      recurring_day: expense.recurringDay || null,
    }
    const { error } = await supabase.from('expenses').insert(payload)
    if (error) {
      toast('Ошибка при сохранении. Проверь соединение.', 'error')
    } else {
      // Если повторяющаяся — сохраняем шаблон
      if (expense.isRecurring && pair) {
        await supabase.from('recurring_templates').insert({
          pair_id: pair.id,
          paid_by: payload.paid_by,
          amount: expense.amount,
          title: expense.title,
          category: expense.category,
          comment: expense.comment || null,
          recurring_day: expense.recurringDay,
        })
      }
      toast('Трата добавлена ✓', 'success')
      await loadExpenses(pair.id)
      setShowModal(false)
    }
  }

  const myTotal = expenses.filter(e => e.paid_by === user.id).reduce((s, e) => s + Number(e.amount), 0)
  const theirTotal = expenses.filter(e => e.paid_by !== user.id).reduce((s, e) => s + Number(e.amount), 0)
  const totalSpent = myTotal + theirTotal
  const fairShare = totalSpent / 2
  const balance = myTotal - fairShare

  const filtered = activeCategory === 'all'
    ? expenses
    : expenses.filter(e => e.category === activeCategory)

  // Имя: берём из профиля, fallback на email
  const myName = myProfile?.name || user.email?.split('@')[0] || 'Я'
  const partnerName = partner?.name || partner?.email?.split('@')[0] || 'Партнёр'
  const myGender = myProfile?.gender || 'other'
  const partnerGender = partner?.gender || 'other'

  const now = new Date()
  const monthName = now.toLocaleString('ru', { month: 'long', year: 'numeric' }).replace(/^./, s => s.toUpperCase())

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-muted)' }}>
      загружаем...
    </div>
  )

  return (
    <div className={styles.wrapper}>
      <LeftTips />
      <div className={styles.app}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.logo}>Поровну</div>
            <div className={styles.monthLabel}>{monthName}</div>
          </div>
          <div className={styles.headerRight}>
            {pair && (
              <div className={styles.avatarPair}>
                <div className={styles.avatarA} title={myName}>
                  {myProfile?.avatar_url
                    ? <img src={myProfile.avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt="" />
                    : myName[0].toUpperCase()}
                </div>
                {partner && (
                  <div className={styles.avatarB} title={partnerName}>
                    {partner?.avatar_url
                      ? <img src={partner.avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} alt="" />
                      : partnerName[0].toUpperCase()}
                  </div>
                )}
              </div>
            )}
            <button className={styles.settingsBtn} onClick={() => navigate('/settings')} title="Настройки">⚙️</button>
          </div>
        </div>

        {/* Month summary bar */}
        <div className={styles.monthBar}>
          <div className={styles.monthStat}>
            <span className={styles.monthStatVal}>₽ {Math.round(totalSpent).toLocaleString('ru')}</span>
            <span className={styles.monthStatLabel}>потрачено вместе</span>
          </div>
          <div className={styles.monthDivider} />
          <div className={styles.monthStat}>
            <span className={styles.monthStatVal}>{expenses.length}</span>
            <span className={styles.monthStatLabel}>трат</span>
          </div>
          <div className={styles.monthDivider} />
          <div className={styles.monthStat}>
            {pairMode === 'shared' ? (
              <>
                <span className={styles.monthStatVal}>₽ {Math.round(myTotal).toLocaleString('ru')}</span>
                <span className={styles.monthStatLabel}>ты потратил{myGender === 'female' ? 'а' : ''}</span>
              </>
            ) : (
              <>
                <span className={styles.monthStatVal}>₽ {Math.round(totalSpent / 2).toLocaleString('ru')}</span>
                <span className={styles.monthStatLabel}>поровну каждому</span>
              </>
            )}
          </div>
        </div>

        {!pair ? (
          <InviteBanner userId={user.id} />
        ) : (
          <>
            <BalanceCard
              balance={balance}
              totalSpent={totalSpent}
              myName={myName}
              partnerName={partnerName}
              myGender={myGender}
              myTotal={myTotal}
              theirTotal={theirTotal}
              mode={pairMode}
            />

            {/* Recurring due today */}
            {recurringDue.length > 0 && (
              <div style={{margin:'0 24px 0',background:'var(--peach-light)',borderRadius:16,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'var(--terracotta)'}}>🔄 Повторяющиеся траты сегодня</div>
                  <div style={{fontSize:12,color:'var(--brown-light)',marginTop:3}}>{recurringDue.map(t=>t.title).join(', ')}</div>
                </div>
                <button
                  onClick={async () => {
                    for (const t of recurringDue) {
                      await supabase.from('expenses').insert({ pair_id: pair.id, paid_by: t.paid_by, amount: t.amount, title: t.title, category: t.category, comment: t.comment })
                    }
                    toast(`Добавлено ${recurringDue.length} трат ✓`, 'success')
                    setRecurringDue([])
                    await loadExpenses(pair.id)
                  }}
                  style={{background:'var(--terracotta)',color:'white',border:'none',borderRadius:10,padding:'8px 14px',fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}
                >
                  Добавить все
                </button>
              </div>
            )}

            <InsightCards
              expenses={expenses}
              userId={user.id}
              myName={myName}
              partnerName={partnerName}
              myGender={myGender}
            />

            {/* Category filter */}
            <CategoryFilter active={activeCategory} onChange={setActiveCategory} pairId={pair?.id} onCategoriesChange={setAllCategories} />

            <TransactionList
              expenses={filtered}
              userId={user.id}
              myName={myName}
              partnerName={partnerName}
              allCategories={allCategories}
              myGender={myGender}
              partnerGender={partnerGender}
              onDelete={handleDeleteExpense}
              onEdit={handleEditExpense}
            />
          </>
        )}

        <div className={styles.bottomSpace} />

        {pair && (
          <button className={styles.fab} onClick={() => setShowModal(true)}>
            + Добавить трату
          </button>
        )}

        {showModal && (
          <AddExpenseModal
            onClose={() => setShowModal(false)}
            onSave={handleAddExpense}
            myName={myName}
            partnerName={partnerName}
            userId={user.id}
            categories={allCategories}
          />
        )}
      </div>
      <RightTips
        myName={myName}
        partnerName={partnerName}
        myGender={myGender}
        partnerGender={partnerGender}
        totalSpent={totalSpent}
        expenseCount={expenses.length}
        myTotal={myTotal}
        theirTotal={theirTotal}
        pairMode={pairMode}
        expenses={expenses}
        userId={user.id}
      />
    </div>
  )
}
