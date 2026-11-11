<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'
import { useChoreLogsStore, type ChoreLog } from '@/stores/chorelogs'
import { iconFor } from '@/lib/icons'
import { formatKr } from '@/lib/format'
import { summarize, type ChoreSummary } from '@/lib/summary'
import { playCoin, playUndo } from '@/lib/sound'
import { useChoresStore, type Chore } from '@/stores/chores'

const { t, locale } = useI18n()
const logsStore = useChoreLogsStore()
const choresStore = useChoresStore()

// Rows adjusted during this visit stay visible even if they hit zero, so a slip can be undone here.
const touched = ref(new Set<string>())
const errorMsg = ref('')

// Earned per chore since the last payout.
const summary = computed(() => summarize(logsStore.logs, touched.value))

onMounted(() => {
  choresStore.fetch().catch(() => {}) // current prices for the + button
})

// The chore to log against: the active one, or (if it was archived) a stand-in using
// the price of its latest plus.
function choreFor(row: ChoreSummary): Chore {
  const active = choresStore.chores.find((c) => c.id === row.id)
  if (active) return active
  let price = 0
  for (let i = logsStore.logs.length - 1; i >= 0; i--) {
    const l = logsStore.logs[i]
    if (l.chore_id === row.id && l.delta === 1) {
      price = l.amount
      break
    }
  }
  return { id: row.id, name: row.name, description: null, price, icon: row.icon, color: row.color }
}

// Corrections are logged like any other tap (+1 / -1), so the history stays honest.
async function adjust(row: ChoreSummary, delta: 1 | -1) {
  errorMsg.value = ''
  touched.value.add(row.id)
  if (delta === 1) playCoin() // inside the tap, so the browser allows audio
  else playUndo()
  try {
    await logsStore.log(choreFor(row), delta)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : t('common.couldNotSave')
  }
}

const dayFormat = computed(() => new Intl.DateTimeFormat(locale.value, { weekday: 'short', day: 'numeric', month: 'short' }))
const timeFormat = computed(() => new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' }))

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayLabel(d: Date) {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (dayKey(d) === dayKey(now)) return t('earned.today')
  if (dayKey(d) === dayKey(yesterday)) return t('earned.yesterday')
  return dayFormat.value.format(d)
}

// Log grouped per day, newest first.
const days = computed(() => {
  const groups: { key: string; label: string; logs: ChoreLog[] }[] = []
  const newestFirst = [...logsStore.logs].sort((a, b) => b.created_at.localeCompare(a.created_at))
  for (const log of newestFirst) {
    const d = new Date(log.created_at)
    const key = dayKey(d)
    let group = groups.find((g) => g.key === key)
    if (!group) {
      group = { key, label: dayLabel(d), logs: [] }
      groups.push(group)
    }
    group.logs.push(log)
  }
  return groups
})

function signed(log: ChoreLog) {
  return `${log.delta > 0 ? '+' : ''}${formatKr(log.amount * log.delta)}`
}
</script>

<template>
  <div class="earned-page">
    <h1 class="page-title">{{ t('earned.title') }}</h1>

    <p v-if="!logsStore.logs.length" class="text-muted">{{ t('earned.nothing') }}</p>
    <p v-if="errorMsg" class="text-danger">{{ errorMsg }}</p>

    <section v-if="summary.length" class="earned-page__section">
      <ul class="earned-page__card">
        <li v-for="row in summary" :key="row.id" class="entry">
          <span class="entry__icon" :style="{ backgroundColor: row.color ?? undefined }">
            <component :is="iconFor(row.icon)" :size="18" />
          </span>
          <span class="entry__text">
            <span class="entry__name h6">{{ row.name }}</span>
            <span class="entry__sum">{{ formatKr(row.sum) }}</span>
          </span>
          <span class="entry__stepper">
            <button class="btn btn-light entry__btn" type="button" :disabled="row.count <= 0"
              :aria-label="t('chores.removeOne', { name: row.name })" @click="adjust(row, -1)">
              <Minus :size="16" />
            </button>
            <span class="entry__count">{{ row.count }}</span>
            <button class="btn btn-primary entry__btn" type="button"
              :aria-label="t('chores.addOne', { name: row.name })" @click="adjust(row, 1)">
              <Plus :size="16" />
            </button>
          </span>
        </li>
        <li class="entry entry--total">
          <span class="entry__name h5">{{ t('earned.total') }}</span>
          <span class="entry__amount h5">{{ formatKr(logsStore.balance) }}</span>
        </li>
      </ul>
    </section>

    <section v-if="days.length" class="earned-page__section">
      <h2 class="h4">{{ t('earned.log') }}</h2>
      <div v-for="day in days" :key="day.key" class="earned-page__day">
        <h3 class="h6 text-muted">{{ day.label }}</h3>
        <ul class="earned-page__card">
          <li v-for="log in day.logs" :key="log.id" class="entry" :class="{ 'entry--undo': log.delta < 0 }">
            <span class="entry__icon" :style="{ backgroundColor: log.chores?.color ?? undefined }">
              <component :is="iconFor(log.chores?.icon)" :size="18" />
            </span>
            <span class="entry__name h6">{{ log.chores?.name ?? t('earned.removedChore') }}</span>
            <span class="entry__meta text-muted">{{ timeFormat.format(new Date(log.created_at)) }}</span>
            <span class="entry__amount">{{ signed(log) }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
