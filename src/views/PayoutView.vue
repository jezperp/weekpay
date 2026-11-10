<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'
import { useChoreLogsStore } from '@/stores/chorelogs'
import { usePayoutsStore } from '@/stores/payouts'
import { iconFor } from '@/lib/icons'
import { formatKr } from '@/lib/format'
import { playPayout } from '@/lib/sound'
import { summarize, type ChoreSummary } from '@/lib/summary'
import PayoutConfirmModal from '@/components/PayoutConfirmModal.vue'

const { t, locale } = useI18n()
const route = useRoute()
const logsStore = useChoreLogsStore()
const payoutsStore = usePayoutsStore()

const childId = route.params.id as string

const dateFormat = computed(() => new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'short', year: 'numeric' }))
const formatDate = (iso: string) => dateFormat.value.format(new Date(iso))

const modalOpen = ref(false)
const saving = ref(false)
const error = ref('')
const loadError = ref('')
const justPaid = ref<number | null>(null)

// Oldest unpaid log = start of the period being paid out.
const since = computed(() => {
  const first = logsStore.logs.reduce<string | null>(
    (min, l) => (min === null || l.created_at < min ? l.created_at : min),
    null,
  )
  return first ? formatDate(first) : ''
})

const canPayOut = computed(() => logsStore.balance > 0)

onMounted(async () => {
  try {
    await payoutsStore.fetch(childId)
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : t('payout.couldNotLoad')
  }
})

function openConfirm() {
  error.value = ''
  modalOpen.value = true
}

async function confirm() {
  const amount = logsStore.balance
  playPayout() // inside the tap, so the browser allows audio
  saving.value = true
  error.value = ''
  try {
    await payoutsStore.payOut(childId)
    await logsStore.fetch(childId) // balance goes to zero; the nav counter counts down
    justPaid.value = amount
    modalOpen.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('common.somethingWrong')
  } finally {
    saving.value = false
  }
}

// Past payouts expand to show which chores they contained (loaded on demand).
const expanded = ref<string | null>(null)
const details = ref<Record<string, ChoreSummary[]>>({})

async function toggle(id: string) {
  if (expanded.value === id) {
    expanded.value = null
    return
  }
  expanded.value = id
  if (details.value[id]) return
  try {
    details.value[id] = summarize(await payoutsStore.logsFor(id))
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : t('payout.couldNotLoadDetails')
  }
}

function period(from: string | null, to: string | null) {
  if (!from || !to) return ''
  return from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`
}
</script>

<template>
  <div class="payout">
    <h1 class="page-title">{{ t('payout.title') }}</h1>

    <p v-if="loadError" class="text-danger">{{ loadError }}</p>

    <section class="payout__hero">
      <p v-if="justPaid !== null" class="alert alert-success w-100 mb-0">
        {{ t('payout.paidOut', { amount: formatKr(justPaid) }) }}
      </p>
      <p class="text-muted mb-0">{{ t('payout.toPayOut') }}</p>
      <p class="payout__amount">{{ formatKr(logsStore.balance) }}</p>
      <p v-if="since && canPayOut" class="text-muted">{{ t('payout.since', { date: since }) }}</p>
      <p v-else class="text-muted">{{ t('payout.nothing') }}</p>
      <button class="btn btn-success btn-lg w-100" type="button" :disabled="!canPayOut" @click="openConfirm">
        {{ t('payout.markAsPaid') }}
      </button>
    </section>

    <section v-if="payoutsStore.payouts.length" class="payout__section">
      <h2 class="h4">{{ t('payout.earlier') }}</h2>
      <ul class="earned-page__card">
        <li v-for="p in payoutsStore.payouts" :key="p.id" class="payout__item">
          <button class="payout__row" type="button" :aria-expanded="expanded === p.id" @click="toggle(p.id)">
            <span class="payout__when">
              <span class="h6 d-block mb-0">{{ formatDate(p.paid_at) }}</span>
              <span class="text-muted payout__period">{{ period(p.period_start, p.period_end) }}</span>
            </span>
            <span class="entry__amount">{{ formatKr(p.amount) }}</span>
            <ChevronDown :size="18" class="payout__chevron text-muted"
              :class="{ 'payout__chevron--open': expanded === p.id }" />
          </button>

          <ul v-if="expanded === p.id" class="payout__details">
            <li v-for="row in details[p.id] ?? []" :key="row.id" class="entry">
              <span class="entry__icon" :style="{ backgroundColor: row.color ?? undefined }">
                <component :is="iconFor(row.icon)" :size="18" />
              </span>
              <span class="entry__name h6">{{ row.name }}</span>
              <span class="entry__meta text-muted">{{ row.count }} ×</span>
              <span class="entry__amount">{{ formatKr(row.sum) }}</span>
            </li>
          </ul>
        </li>
      </ul>
    </section>

    <PayoutConfirmModal :open="modalOpen" :amount="logsStore.balance" :since="since" :saving="saving"
      :error="error" @confirm="confirm" @close="modalOpen = false" />
  </div>
</template>
