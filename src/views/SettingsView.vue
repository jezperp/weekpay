<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, LogOut, Pencil, Plus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useChildrenStore, type ChildInput } from '@/stores/children'
import { useChoresStore, type Chore, type ChoreInput } from '@/stores/chores'
import { iconFor } from '@/lib/icons'
import { formatKr } from '@/lib/format'
import { soundEnabled } from '@/lib/sound'
import { themeMode, type ThemeMode } from '@/lib/theme'
import ChoreFormModal from '@/components/ChoreFormModal.vue'
import ChildFormModal from '@/components/ChildFormModal.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const childrenStore = useChildrenStore()
const choresStore = useChoresStore()

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const childId = route.params.id as string
const child = computed(() => childrenStore.byId(childId))

const choreModalOpen = ref(false)
const editingChore = ref<Chore | null>(null)
const childModalOpen = ref(false)
const saving = ref(false)
const error = ref('')
const loadError = ref('')

onMounted(async () => {
  try {
    await choresStore.fetch()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Could not load chores'
  }
})

function openChore(chore: Chore | null) {
  editingChore.value = chore
  error.value = ''
  choreModalOpen.value = true
}

function openChild() {
  error.value = ''
  childModalOpen.value = true
}

async function run(action: () => Promise<void>, close: () => void) {
  saving.value = true
  error.value = ''
  try {
    await action()
    close()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong'
  } finally {
    saving.value = false
  }
}

function saveChore(input: ChoreInput) {
  const chore = editingChore.value
  return run(
    () => (chore ? choresStore.update(chore.id, input) : choresStore.add(input)),
    () => (choreModalOpen.value = false),
  )
}

function archiveChore() {
  const chore = editingChore.value
  if (!chore) return
  return run(() => choresStore.archive(chore.id), () => (choreModalOpen.value = false))
}

function saveChild(input: ChildInput) {
  return run(() => childrenStore.update(childId, input), () => (childModalOpen.value = false))
}

function removeChild() {
  return run(
    () => childrenStore.remove(childId),
    () => router.replace({ name: 'profiles' }),
  )
}

async function logout() {
  await auth.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="settings">
    <h1 class="h2">Settings</h1>

    <p v-if="loadError" class="text-danger">{{ loadError }}</p>

    <section class="settings__section">
      <div class="settings__heading">
        <h2 class="h4 mb-0">Chores</h2>
        <button class="btn btn-primary btn-sm" type="button" @click="openChore(null)">
          <Plus :size="16" class="me-1" />Add chore
        </button>
      </div>

      <ul class="settings__list">
        <li v-for="chore in choresStore.chores" :key="chore.id">
          <button class="settings__row" type="button" @click="openChore(chore)">
            <span class="settings__icon" :style="{ backgroundColor: chore.color ?? undefined }">
              <component :is="iconFor(chore.icon)" :size="18" />
            </span>
            <span class="settings__name h6">{{ chore.name }}</span>
            <span class="settings__price text-muted">{{ formatKr(chore.price) }}</span>
            <ChevronRight :size="18" class="text-muted" />
          </button>
        </li>
      </ul>

      <p v-if="choresStore.loaded && !choresStore.chores.length" class="text-muted">No chores yet.</p>
    </section>

    <section class="settings__section">
      <h2 class="h4">Profile</h2>
      <button class="settings__row" type="button" :disabled="!child" @click="openChild">
        <span class="settings__icon" :style="{ backgroundColor: child?.color ?? undefined }">
          {{ child?.name.charAt(0).toUpperCase() }}
        </span>
        <span class="settings__name h6">{{ child?.name }}</span>
        <Pencil :size="18" class="text-muted" />
      </button>
    </section>

    <section class="settings__section">
      <h2 class="h4">Appearance</h2>
      <div class="btn-group" role="group" aria-label="Theme">
        <template v-for="t in THEMES" :key="t.value">
          <input :id="`theme-${t.value}`" v-model="themeMode" type="radio" class="btn-check" name="theme"
            :value="t.value" autocomplete="off" />
          <label class="btn btn-outline-primary" :for="`theme-${t.value}`">{{ t.label }}</label>
        </template>
      </div>
    </section>

    <section class="settings__section">
      <h2 class="h4">Sound</h2>
      <div class="form-check form-switch">
        <input id="sound" v-model="soundEnabled" class="form-check-input" type="checkbox" role="switch" />
        <label class="form-check-label" for="sound">Coin sounds</label>
      </div>
    </section>

    <section class="settings__section">
      <button class="btn btn-outline-secondary w-100" type="button" @click="logout">
        <LogOut :size="16" class="me-1" />Sign out
      </button>
    </section>

    <ChoreFormModal :open="choreModalOpen" :chore="editingChore" :saving="saving" :error="error" @save="saveChore"
      @archive="archiveChore" @close="choreModalOpen = false" />
    <ChildFormModal :open="childModalOpen" :child="child ?? null" :saving="saving" :error="error" @save="saveChild"
      @remove="removeChild" @close="childModalOpen = false" />
  </div>
</template>
