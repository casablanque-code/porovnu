import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import styles from './SettingsPage.module.css'

const AVATAR_COLORS = ['#C96A3A','#8BA888','#7B9EC9','#C97BAA','#C9A83A','#7BC9C0']

export default function PartnerPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pair, setPair] = useState(null)
  const [partner, setPartner] = useState(null)
  const [leaving, setLeaving] = useState(false)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => { loadPair() }, [])

  async function loadPair() {
    const { data } = await supabase.from('pairs').select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).single()
    if (!data) return
    setPair(data)
    const partnerId = data.user1_id === user.id ? data.user2_id : data.user1_id
    const { data: p } = await supabase.from('profiles').select('*').eq('id', partnerId).single()
    if (p) setPartner(p)
  }

  async function handleLeavePair() {
    if (!pair) return
    setLeaving(true)
    const { error } = await supabase.rpc('leave_pair', { p_pair_id: pair.id, p_user_id: user.id })
    setLeaving(false)
    if (!error) navigate('/')
    else alert('Ошибка при выходе из пары')
  }

  const partnerColor = AVATAR_COLORS[(partner?.id?.charCodeAt(0)||1) % AVATAR_COLORS.length]
  const partnerName = partner?.name || partner?.email?.split('@')[0] || 'Партнёр'

  return (
    <div className={styles.wrapper}>
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/settings')}>←</button>
          <div className={styles.headerTitle}>Партнёр</div>
          <div />
        </div>

        <div className={styles.section}>
          {partner ? (
            <>
              <div className={styles.partnerCard}>
                <div className={styles.partnerAvatar} style={{ background: partnerColor }}>
                  {partner.avatar_url
                    ? <img src={partner.avatar_url} className={styles.avatarImg} alt="" />
                    : partnerName[0].toUpperCase()}
                </div>
                <div>
                  <div className={styles.partnerName}>{partnerName}</div>
                  <div className={styles.partnerEmail}>{partner.email}</div>
                </div>
              </div>

              <div className={styles.leaveSection}>
                {!confirm ? (
                  <button className={styles.leaveBtn} onClick={() => setConfirm(true)}>
                    Выйти из пары
                  </button>
                ) : (
                  <div className={styles.confirmBlock}>
                    <div className={styles.confirmText}>
                      Уверен? Пара будет удалена для обоих участников. Траты сохранятся в истории.
                    </div>
                    <div className={styles.confirmBtns}>
                      <button className={styles.confirmYes} onClick={handleLeavePair} disabled={leaving}>
                        {leaving ? 'Выходим...' : 'Да, выйти'}
                      </button>
                      <button className={styles.confirmNo} onClick={() => setConfirm(false)}>
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.noPartner}>
              <div style={{fontSize:48,marginBottom:12}}>👤</div>
              <div className={styles.noPartnerText}>Партнёр ещё не подключился</div>
              <div className={styles.noPartnerSub}>Отправь инвайт-ссылку с главного экрана</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
