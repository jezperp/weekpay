import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export interface Child {
  id: string
  name: string
  color: string | null
  created_at: string
}

export interface ChildInput {
  name: string
  color: string
}

export const useChildrenStore = defineStore('children', () => {
  const children = ref<Child[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('children')
        .select('id, name, color, created_at')
        .order('created_at')
      if (error) throw error
      children.value = data
    } finally {
      loading.value = false
    }
  }

  async function add(input: ChildInput) {
    // parent_id is filled in by the database (default auth.uid()).
    const { data, error } = await supabase
      .from('children')
      .insert(input)
      .select('id, name, color, created_at')
      .single()
    if (error) throw error
    children.value.push(data)
  }

  async function update(id: string, input: ChildInput) {
    const { data, error } = await supabase
      .from('children')
      .update(input)
      .eq('id', id)
      .select('id, name, color, created_at')
      .single()
    if (error) throw error
    const i = children.value.findIndex((c) => c.id === id)
    if (i !== -1) children.value[i] = data
  }

  async function remove(id: string) {
    const { error } = await supabase.from('children').delete().eq('id', id)
    if (error) throw error
    children.value = children.value.filter((c) => c.id !== id)
  }

  function byId(id: string) {
    return children.value.find((c) => c.id === id)
  }

  return { children, loading, fetch, add, update, remove, byId }
})
