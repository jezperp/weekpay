import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export interface Chore {
  id: string
  name: string
  description: string | null
  price: number
  icon: string | null
  color: string | null
}

export type ChoreInput = Omit<Chore, 'id'>

const COLUMNS = 'id, name, description, price, icon, color'

export const useChoresStore = defineStore('chores', () => {
  const chores = ref<Chore[]>([])
  const loaded = ref(false)

  async function fetch() {
    const { data, error } = await supabase
      .from('chores')
      .select(COLUMNS)
      .eq('archived', false)
      .order('created_at')
    if (error) throw error
    chores.value = data
    loaded.value = true
  }

  async function add(input: ChoreInput) {
    // parent_id is filled in by the database (default auth.uid()).
    const { data, error } = await supabase.from('chores').insert(input).select(COLUMNS).single()
    if (error) throw error
    chores.value.push(data)
  }

  async function update(id: string, input: ChoreInput) {
    const { data, error } = await supabase.from('chores').update(input).eq('id', id).select(COLUMNS).single()
    if (error) throw error
    const i = chores.value.findIndex((c) => c.id === id)
    if (i !== -1) chores.value[i] = data
  }

  // Archive instead of delete so logged history keeps pointing at the chore.
  async function archive(id: string) {
    const { error } = await supabase.from('chores').update({ archived: true }).eq('id', id)
    if (error) throw error
    chores.value = chores.value.filter((c) => c.id !== id)
  }

  return { chores, loaded, fetch, add, update, archive }
})
