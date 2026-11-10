import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Chore } from '@/stores/chores'

export interface ChoreLog {
  id: string
  chore_id: string
  amount: number
  delta: 1 | -1
}

const round2 = (n: number) => Math.round(n * 100) / 100

// Unpaid logs (payout_id is null) for one child at a time.
export const useChoreLogsStore = defineStore('chorelogs', () => {
  const childId = ref<string | null>(null)
  const logs = ref<ChoreLog[]>([])

  const counts = computed(() => {
    const map = new Map<string, number>()
    for (const l of logs.value) map.set(l.chore_id, (map.get(l.chore_id) ?? 0) + l.delta)
    return map
  })

  const earnedMap = computed(() => {
    const map = new Map<string, number>()
    for (const l of logs.value) map.set(l.chore_id, (map.get(l.chore_id) ?? 0) + l.amount * l.delta)
    return map
  })

  const balance = computed(() => round2(logs.value.reduce((sum, l) => sum + l.amount * l.delta, 0)))

  // Switch to another child and drop the previous child's logs right away
  // (so the counter never flashes the wrong balance).
  function reset(id: string) {
    if (childId.value === id) return
    childId.value = id
    logs.value = []
  }

  async function fetch(id: string) {
    reset(id)
    const { data, error } = await supabase
      .from('chore_logs')
      .select('id, chore_id, amount, delta')
      .eq('child_id', id)
      .is('payout_id', null)
      .order('created_at')
    if (error) throw error
    // Ignore a stale response if the user navigated to another child meanwhile.
    if (childId.value === id) logs.value = data as ChoreLog[]
  }

  function count(choreId: string) {
    return counts.value.get(choreId) ?? 0
  }

  function earned(choreId: string) {
    return round2(earnedMap.value.get(choreId) ?? 0)
  }

  // Every tap is logged as its own row. Optimistic update, rolled back on failure.
  async function log(chore: Chore, delta: 1 | -1) {
    const id = childId.value
    if (!id) return
    if (delta === -1 && count(chore.id) <= 0) return // never below zero per chore

    // A minus undoes the most recent plus, so it uses that plus's price snapshot
    // (the chore price may have changed since).
    let amount = chore.price
    if (delta === -1) {
      for (let i = logs.value.length - 1; i >= 0; i--) {
        if (logs.value[i].chore_id === chore.id && logs.value[i].delta === 1) {
          amount = logs.value[i].amount
          break
        }
      }
    }

    const temp: ChoreLog = { id: `tmp-${crypto.randomUUID()}`, chore_id: chore.id, amount, delta }
    logs.value.push(temp)
    const { data, error } = await supabase
      .from('chore_logs')
      .insert({ child_id: id, chore_id: chore.id, amount, delta })
      .select('id, chore_id, amount, delta')
      .single()
    const i = logs.value.findIndex((l) => l.id === temp.id)
    if (error) {
      if (i !== -1) logs.value.splice(i, 1)
      throw error
    }
    if (i !== -1) logs.value[i] = data as ChoreLog
  }

  return { logs, balance, reset, fetch, count, earned, log }
})
