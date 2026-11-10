<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Minus, Pencil, Plus } from 'lucide-vue-next'
import { useChildrenStore } from '@/stores/children'
import { useChoresStore, type Chore, type ChoreInput } from '@/stores/chores'
import { useChoreLogsStore } from '@/stores/chorelogs'
import { iconFor } from '@/lib/icons'
import { formatKr } from '@/lib/format'
import ChoreFormModal from '@/components/ChoreFormModal.vue'

const route = useRoute()
const childrenStore = useChildrenStore()
const choresStore = useChoresStore()
const logsStore = useChoreLogsStore()

const childId = route.params.id as string
const child = computed(() => childrenStore.byId(childId))

const managing = ref(false)
const modalOpen = ref(false)
const editing = ref<Chore | null>(null)
const saving = ref(false)
const error = ref('')
const loadError = ref('')

onMounted(async () => {
  try {
    await Promise.all([
      childrenStore.children.length ? Promise.resolve() : childrenStore.fetch(),
      choresStore.fetch(),
      logsStore.fetch(childId),
    ])
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Could not load data'
  }
})

async function tap(chore: Chore, delta: 1 | -1) {
  loadError.value = ''
  try {
    await logsStore.log(chore, delta)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Could not save'
  }
}

function openAdd() {
  editing.value = null
  error.value = ''
  modalOpen.value = true
}

function openEdit(chore: Chore) {
  editing.value = chore
  error.value = ''
  modalOpen.value = true
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

function save(input: ChoreInput) {
  const chore = editing.value
  return run(() => (chore ? choresStore.update(chore.id, input) : choresStore.add(input)))
}

function archive() {
  const chore = editing.value
  if (!chore) return
  return run(() => choresStore.archive(chore.id))
}
</script>

<template>
  <main class="child">
    <header class="child__header">
      <RouterLink :to="{ name: 'profiles' }" class="btn btn-light child__back" aria-label="Back">
        <ArrowLeft :size="22" />
      </RouterLink>
      <div class="child__who">
        <span class="child__avatar" :style="{ backgroundColor: child?.color ?? undefined }" :title="child?.name">
          {{ child?.name.charAt(0).toUpperCase() }}
        </span>
        <h1 class="visually-hidden">{{ child?.name }}</h1>
      </div>
      <div class="child__balance">
        <span class="child__amount h2">{{ formatKr(logsStore.balance) }}</span>
      </div>
    </header>

    <p v-if="loadError" class="text-danger">{{ loadError }}</p>

    <ul class="child__list">
      <li v-for="chore in choresStore.chores" :key="chore.id" class="chore"
        :class="{ 'chore--active': logsStore.count(chore.id) > 0 }">
        <button class="btn btn-light chore__btn" type="button" :disabled="logsStore.count(chore.id) <= 0"
          :aria-label="`Remove one ${chore.name}`" @click="tap(chore, -1)">
          <Minus :size="16" />
        </button>

        <span class="chore__icon" :style="{ backgroundColor: chore.color ?? undefined }">
          <component :is="iconFor(chore.icon)" :size="18" />
          <span class="chore__price badge rounded-pill text-bg-warning">{{ formatKr(chore.price) }}</span>
          <button v-if="managing" class="btn btn-light chore__edit" type="button"
            :aria-label="`Edit ${chore.name}`" @click="openEdit(chore)">
            <Pencil :size="12" />
          </button>
        </span>

        <h2 class="chore__name h6">{{ chore.name }}</h2>

        <button class="btn btn-primary chore__btn"
          :class="{ 'chore__btn--count': logsStore.count(chore.id) > 0 }" type="button"
          :aria-label="`Add one ${chore.name}, ${logsStore.count(chore.id)} so far`"
          @click="tap(chore, 1)">
          <Plus :size="16" />
          <span v-if="logsStore.count(chore.id) > 0" class="chore__count">{{ logsStore.count(chore.id) }}</span>
        </button>
      </li>

      <li v-if="managing">
        <button class="chore chore--add" type="button" @click="openAdd">
          <Plus :size="24" />
          <span class="h5 mb-0">Add chore</span>
        </button>
      </li>
    </ul>

    <p v-if="choresStore.loaded && !choresStore.chores.length" class="text-muted">
      No chores yet. Tap "Manage" to add the first one.
    </p>

    <div class="child__actions">
      <button class="btn" :class="managing ? 'btn-primary' : 'btn-outline-secondary'" @click="managing = !managing">
        <Pencil :size="16" class="me-1" />{{ managing ? 'Done' : 'Manage' }}
      </button>
    </div>

    <ChoreFormModal :open="modalOpen" :chore="editing" :saving="saving" :error="error" @save="save"
      @archive="archive" @close="modalOpen = false" />
  </main>
</template>
