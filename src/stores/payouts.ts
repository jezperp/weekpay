import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { CHORE_LOG_COLUMNS, type ChoreLog } from '@/stores/chorelogs'

export interface Payout {
  id: string
  amount: number
  period_start: string | null
  period_end: string | null
  paid_at: string
}

export const usePayoutsStore = defineStore('payouts', () => {
  const childId = ref<string | null>(null)
  const payouts = ref<Payout[]>([])
  const loaded = ref(false)

  async function fetch(id: string) {
    if (childId.value !== id) {
      childId.value = id
      payouts.value = []
      loaded.value = false
    }
    const { data, error } = await supabase
      .from('payouts')
      .select('id, amount, period_start, period_end, paid_at')
      .eq('child_id', id)
      .order('paid_at', { ascending: false })
    if (error) throw error
    if (childId.value === id) {
      payouts.value = data
      loaded.value = true
    }
  }

  // Atomic on the database side (see migration 0003): creates the payout and settles all unpaid logs.
  async function payOut(id: string) {
    const { error } = await supabase.rpc('pay_out', { p_child_id: id })
    if (error) throw error
    await fetch(id)
  }

  // Deletes the child's logs and payouts (migration 0004). Chores and the profile are kept.
  async function resetHistory(id: string) {
    const { error } = await supabase.rpc('reset_child_history', { p_child_id: id })
    if (error) throw error
    await fetch(id)
  }

  async function logsFor(payoutId: string) {
    const { data, error } = await supabase
      .from('chore_logs')
      .select(CHORE_LOG_COLUMNS)
      .eq('payout_id', payoutId)
    if (error) throw error
    return data as unknown as ChoreLog[]
  }

  return { payouts, loaded, fetch, payOut, resetHistory, logsFor }
})
