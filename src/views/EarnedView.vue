<script setup lang="ts">
import { computed } from 'vue'
import { useChoreLogsStore, type ChoreLog } from '@/stores/chorelogs'
import { iconFor } from '@/lib/icons'
import { formatKr } from '@/lib/format'

const logsStore = useChoreLogsStore()

interface ChoreSummary {
  id: string
  name: string
  icon: string | null
  color: string | null
  count: number
  sum: number
}

// Earned per chore since the last payout. Chores netting out to zero are left out.
const summary = computed<ChoreSummary[]>(() => {
  const map = new Map<string, ChoreSummary>()
  for (const l of logsStore.logs) {
    const row = map.get(l.chore_id) ?? {
      id: l.chore_id,
      name: l.chores?.name ?? 'Removed chore',
      icon: l.chores?.icon ?? null,
      color: l.chores?.color ?? null,
      count: 0,
      sum: 0,
    }
    row.count += l.delta
    row.sum += l.amount * l.delta
    map.set(l.chore_id, row)
  }
  return [...map.values()]
    .filter((r) => r.count !== 0)
    .map((r) => ({ ...r, sum: Math.round(r.sum * 100) / 100 }))
    .sort((a, b) => b.sum - a.sum)
})

const dayFormat = new Intl.DateTimeFormat('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
const timeFormat = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' })

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayLabel(d: Date) {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (dayKey(d) === dayKey(now)) return 'Today'
  if (dayKey(d) === dayKey(yesterday)) return 'Yesterday'
  return dayFormat.format(d)
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
    <h1 class="h2">Earned</h1>

    <p v-if="!logsStore.logs.length" class="text-muted">Nothing earned yet.</p>

    <section v-if="summary.length" class="earned-page__section">
      <h2 class="h4">By chore</h2>
      <ul class="earned-page__card">
        <li v-for="row in summary" :key="row.id" class="entry">
          <span class="entry__icon" :style="{ backgroundColor: row.color ?? undefined }">
            <component :is="iconFor(row.icon)" :size="18" />
          </span>
          <span class="entry__name h6">{{ row.name }}</span>
          <span class="entry__meta text-muted">{{ row.count }} ×</span>
          <span class="entry__amount">{{ formatKr(row.sum) }}</span>
        </li>
        <li class="entry entry--total">
          <span class="entry__name h5">Total</span>
          <span class="entry__amount h5">{{ formatKr(logsStore.balance) }}</span>
        </li>
      </ul>
    </section>

    <section v-if="days.length" class="earned-page__section">
      <h2 class="h4">Log</h2>
      <div v-for="day in days" :key="day.key" class="earned-page__day">
        <h3 class="h6 text-muted">{{ day.label }}</h3>
        <ul class="earned-page__card">
          <li v-for="log in day.logs" :key="log.id" class="entry" :class="{ 'entry--undo': log.delta < 0 }">
            <span class="entry__icon" :style="{ backgroundColor: log.chores?.color ?? undefined }">
              <component :is="iconFor(log.chores?.icon)" :size="18" />
            </span>
            <span class="entry__name h6">{{ log.chores?.name ?? 'Removed chore' }}</span>
            <span class="entry__meta text-muted">{{ timeFormat.format(new Date(log.created_at)) }}</span>
            <span class="entry__amount">{{ signed(log) }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
