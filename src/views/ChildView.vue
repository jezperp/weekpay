<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Minus, Plus } from 'lucide-vue-next'
import { useChildrenStore } from '@/stores/children'
import { useChoresStore, type Chore } from '@/stores/chores'
import { useChoreLogsStore } from '@/stores/chorelogs'
import { iconFor } from '@/lib/icons'
import { formatKr } from '@/lib/format'
import { playCoin, playUndo } from '@/lib/sound'

const route = useRoute()
const childrenStore = useChildrenStore()
const choresStore = useChoresStore()
const logsStore = useChoreLogsStore()

const childId = route.params.id as string
const child = computed(() => childrenStore.byId(childId))
const loadError = ref('')

onMounted(async () => {
  try {
    await choresStore.fetch()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Could not load data'
  }
})

async function tap(chore: Chore, delta: 1 | -1) {
  loadError.value = ''
  // Play synchronously inside the tap so the browser allows audio.
  if (delta === 1) playCoin()
  else playUndo()
  try {
    await logsStore.log(chore, delta)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Could not save'
  }
}
</script>

<template>
  <div class="child">
    <h1 class="visually-hidden">{{ child?.name }}</h1>

    <p v-if="loadError" class="text-danger">{{ loadError }}</p>

    <ul class="child__list">
      <li v-for="chore in choresStore.chores" :key="chore.id" class="chore">
        <button class="btn btn-light chore__btn" type="button" :disabled="logsStore.count(chore.id) <= 0"
          :aria-label="`Remove one ${chore.name}`" @click="tap(chore, -1)">
          <Minus :size="16" />
        </button>

        <span class="chore__icon" :style="{ backgroundColor: chore.color ?? undefined }">
          <component :is="iconFor(chore.icon)" :size="18" />
          <span class="chore__price badge rounded-pill text-bg-warning">{{ formatKr(chore.price) }}</span>
        </span>

        <h2 class="chore__name h6">{{ chore.name }}</h2>

        <button class="btn btn-primary chore__btn" type="button" :aria-label="`Add one ${chore.name}`"
          @click="tap(chore, 1)">
          <Plus :size="16" />
        </button>
      </li>
    </ul>

    <p v-if="choresStore.loaded && !choresStore.chores.length" class="text-muted">
      No chores yet. Add the first one under Settings.
    </p>
  </div>
</template>
