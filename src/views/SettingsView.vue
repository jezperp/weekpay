<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, LogOut, Pencil, Plus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useChildrenStore, type ChildInput } from '@/stores/children'
import { useChoresStore, type Chore, type ChoreInput } from '@/stores/chores'
import { useChoreLogsStore } from '@/stores/chorelogs'
import { usePayoutsStore } from '@/stores/payouts'
import { iconFor } from '@/lib/icons'
import { formatKr } from '@/lib/format'
import { soundEnabled } from '@/lib/sound'
import { themeMode, type ThemeMode } from '@/lib/theme'
import { languageMode, type LanguageMode } from '@/lib/language'
import ChoreFormModal from '@/components/ChoreFormModal.vue'
import ChildFormModal from '@/components/ChildFormModal.vue'
import ResetHistoryModal from '@/components/ResetHistoryModal.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const childrenStore = useChildrenStore()
const choresStore = useChoresStore()
const logsStore = useChoreLogsStore()
const payoutsStore = usePayoutsStore()

const THEMES: { value: ThemeMode; labelKey: string }[] = [
  { value: 'system', labelKey: 'settings.system' },
  { value: 'light', labelKey: 'settings.light' },
  { value: 'dark', labelKey: 'settings.dark' },
]

const LANGUAGES: { value: LanguageMode; labelKey?: string; label?: string }[] = [
  { value: 'system', labelKey: 'settings.system' },
  { value: 'sv', label: 'Svenska' },
  { value: 'en', label: 'English' },
]

const childId = route.params.id as string
const child = computed(() => childrenStore.byId(childId))

const choreModalOpen = ref(false)
const editingChore = ref<Chore | null>(null)
const childModalOpen = ref(false)
const resetOpen = ref(false)
const resetDone = ref(false)
const saving = ref(false)
const error = ref('')
const loadError = ref('')

onMounted(async () => {
  try {
    await choresStore.fetch()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : t('settings.couldNotLoad')
  }
})

function openChore(chore: Chore | null) {
  editingChore.value = chore
  error.value = ''
  choreModalOpen.value = true
}

function openReset() {
  error.value = ''
  resetDone.value = false
  resetOpen.value = true
}

function resetHistory() {
  return run(
    async () => {
      await payoutsStore.resetHistory(childId)
      await logsStore.fetch(childId) // balance goes to zero in the nav
      resetDone.value = true
    },
    () => (resetOpen.value = false),
  )
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
    error.value = e instanceof Error ? e.message : t('common.somethingWrong')
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
    <h1 class="page-title">{{ t('settings.title') }}</h1>

    <p v-if="loadError" class="text-danger">{{ loadError }}</p>

    <section class="settings__section">
      <div class="settings__heading">
        <h2 class="h4 mb-0">{{ t('settings.chores') }}</h2>
        <button class="btn btn-primary btn-sm rounded-pill" type="button" @click="openChore(null)">
          <Plus :size="16" class="me-1" />{{ t('settings.addChore') }}
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

      <p v-if="choresStore.loaded && !choresStore.chores.length" class="text-muted">{{ t('settings.noChores') }}</p>
    </section>

    <section class="settings__section">
      <h2 class="h4">{{ t('settings.profile') }}</h2>
      <button class="settings__row" type="button" :disabled="!child" @click="openChild">
        <span class="settings__icon" :style="{ backgroundColor: child?.color ?? undefined }">
          {{ child?.name.charAt(0).toUpperCase() }}
        </span>
        <span class="settings__name h6">{{ child?.name }}</span>
        <Pencil :size="18" class="text-muted" />
      </button>
    </section>

    <section class="settings__section">
      <h2 class="h4">{{ t('settings.appearance') }}</h2>
      <div class="btn-group settings__segmented" role="group" :aria-label="t('settings.theme')">
        <template v-for="opt in THEMES" :key="opt.value">
          <input :id="`theme-${opt.value}`" v-model="themeMode" type="radio" class="btn-check" name="theme"
            :value="opt.value" autocomplete="off" />
          <label class="btn btn-sm btn-outline-primary" :for="`theme-${opt.value}`">{{ t(opt.labelKey) }}</label>
        </template>
      </div>
    </section>

    <section class="settings__section">
      <h2 class="h4">{{ t('settings.language') }}</h2>
      <div class="btn-group settings__segmented" role="group" :aria-label="t('settings.language')">
        <template v-for="opt in LANGUAGES" :key="opt.value">
          <input :id="`lang-${opt.value}`" v-model="languageMode" type="radio" class="btn-check" name="language"
            :value="opt.value" autocomplete="off" />
          <label class="btn btn-sm btn-outline-primary" :for="`lang-${opt.value}`">
            {{ opt.labelKey ? t(opt.labelKey) : opt.label }}
          </label>
        </template>
      </div>
    </section>

    <section class="settings__section">
      <h2 class="h4">{{ t('settings.sound') }}</h2>
      <div class="form-check form-switch">
        <input id="sound" v-model="soundEnabled" class="form-check-input" type="checkbox" role="switch" />
        <label class="form-check-label" for="sound">{{ t('settings.coinSounds') }}</label>
      </div>
    </section>

    <section class="settings__section">
      <button class="btn btn-outline-secondary w-100" type="button" @click="logout">
        <LogOut :size="16" class="me-1" />{{ t('settings.signOut') }}
      </button>
    </section>

    <section class="settings__section settings__danger">
      <h2 class="h4 text-danger">{{ t('reset.dangerZone') }}</h2>
      <p v-if="resetDone" class="alert alert-success mb-0">{{ t('reset.done', { name: child?.name }) }}</p>
      <p class="text-muted mb-0">{{ t('reset.description') }}</p>
      <button class="btn btn-outline-danger w-100" type="button" :disabled="!child" @click="openReset">
        {{ t('reset.button') }}
      </button>
    </section>

    <ChoreFormModal :open="choreModalOpen" :chore="editingChore" :saving="saving" :error="error" @save="saveChore"
      @archive="archiveChore" @close="choreModalOpen = false" />
    <ResetHistoryModal :open="resetOpen" :child-name="child?.name ?? ''" :saving="saving" :error="error"
      @confirm="resetHistory" @close="resetOpen = false" />
    <ChildFormModal :open="childModalOpen" :child="child ?? null" :saving="saving" :error="error" @save="saveChild"
      @remove="removeChild" @close="childModalOpen = false" />
  </div>
</template>
