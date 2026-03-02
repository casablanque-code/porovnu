import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeExpenses(pairId, onUpdate) {
  useEffect(() => {
    if (!pairId) return

    const channel = supabase
      .channel(`expenses:${pairId}`)
      .on('postgres_changes', {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'expenses',
        filter: `pair_id=eq.${pairId}`,
      }, () => {
        onUpdate()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [pairId])
}
