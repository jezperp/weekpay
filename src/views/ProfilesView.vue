<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Pencil, Plus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useChildrenStore, type Child, type ChildInput } from '@/stores/children'
import ChildFormModal from '@/components/ChildFormModal.vue'

const auth = useAuthStore()
const store = useChildrenStore()
const router = useRouter()

const managing = ref(false)
const modalOpen = ref(false)
const editing = ref<Child | null>(null)
const saving = ref(false)
const error = ref('')
const loadError = ref('')

onMounted(async () => {
  try {
    await store.fetch()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Could not load profiles'
  }
})

function openAdd() {
  editing.value = null
  error.value = ''
  modalOpen.value = true
}

function openEdit(child: Child) {
  editing.value = child
  error.value = ''
  modalOpen.value = true
}

function pick(child: Child) {
  if (managing.value) openEdit(child)
  else router.push({ name: 'child', params: { id: child.id } })
}

async function run(action: () => Promise<void>) {
  saving.value = true
  error.value = ''
  try {
    await action()
    modalOpen.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong'
  } finally {
    saving.value = false
  }
}

function save(input: ChildInput) {
  const child = editing.value
  return run(() => (child ? store.update(child.id, input) : store.add(input)))
}

function remove() {
  const child = editing.value
  if (!child) return
  return run(() => store.remove(child.id))
}

async function logout() {
  await auth.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <main class="profiles">
    <h1 class="profiles__title">Who's earning today?</h1>

    <p v-if="loadError" class="text-danger">{{ loadError }}</p>

    <ul class="profiles__grid">
      <li v-for="child in store.children" :key="child.id">
        <button class="profiles__card" type="button" @click="pick(child)">
          <span class="profiles__avatar" :style="{ backgroundColor: child.color ?? undefined }">
            {{ child.name.charAt(0).toUpperCase() }}
            <span v-if="managing" class="profiles__edit"><Pencil :size="22" /></span>
          </span>
          <span class="profiles__name h4">{{ child.name }}</span>
        </button>
      </li>
      <li>
        <button class="profiles__card profiles__card--add" type="button" @click="openAdd">
          <span class="profiles__avatar"><Plus :size="48" /></span>
          <span class="profiles__name h4">Add child</span>
        </button>
      </li>
    </ul>

    <div class="profiles__actions">
      <button class="btn" :class="managing ? 'btn-primary' : 'btn-outline-secondary'" @click="managing = !managing">
        <Pencil :size="16" class="me-1" />{{ managing ? 'Done' : 'Manage' }}
      </button>
      <button class="btn btn-link text-muted" @click="logout">Sign out</button>
    </div>

    <ChildFormModal :open="modalOpen" :child="editing" :saving="saving" :error="error" @save="save" @remove="remove"
      @close="modalOpen = false" />
  </main>
</template>
