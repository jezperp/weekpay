<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { iconFor } from '@/lib/icons'
import { formatKr } from '@/lib/format'
import { PALETTE } from '@/lib/palette'
import type { Chore } from '@/stores/chores'
import EarnedCounter from '@/components/EarnedCounter.vue'

const props = defineProps<{
  chore: Chore
  amount: number // what this tap earned
  fromTotal: number // total before the tap
  toTotal: number // total after the tap
}>()

const emit = defineEmits<{ close: []; undo: [] }>()

const { t } = useI18n()

// Doesn't let you tap through instantly: "Done" unlocks after a moment, and the screen closes by itself.
const UNLOCK_MS = 1200
const AUTO_CLOSE_MS = 4500

const canClose = ref(false)
const shownTotal = ref(props.fromTotal)
const timers: number[] = []

const confetti = Array.from({ length: 28 }, (_, i) => ({
  left: Math.random() * 100,
  delay: Math.random() * 0.9,
  duration: 2.2 + Math.random() * 1.6,
  size: 6 + Math.random() * 7,
  color: PALETTE[i % PALETTE.length],
}))

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && canClose.value) emit('close')
}

onMounted(() => {
  timers.push(window.setTimeout(() => (canClose.value = true), UNLOCK_MS))
  // Let the screen appear first, then count the total up.
  timers.push(window.setTimeout(() => (shownTotal.value = props.toTotal), 400))
  timers.push(window.setTimeout(() => emit('close'), AUTO_CLOSE_MS))
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  timers.forEach((id) => window.clearTimeout(id))
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="done" role="dialog" aria-modal="true" aria-labelledby="done-title">
    <span v-for="(c, i) in confetti" :key="i" class="done__confetti" aria-hidden="true"
      :style="{
        left: `${c.left}%`,
        width: `${c.size}px`,
        height: `${c.size * 1.6}px`,
        backgroundColor: c.color,
        '--delay': `${c.delay}s`,
        '--duration': `${c.duration}s`,
      }" />

    <span class="done__icon" :style="{ backgroundColor: chore.color ?? undefined }">
      <component :is="iconFor(chore.icon)" :size="56" />
    </span>

    <h2 id="done-title" class="done__title">{{ t('done.title') }}</h2>
    <p class="done__text">{{ t('done.text', { name: chore.name, amount: formatKr(amount) }) }}</p>

    <p class="done__total">
      {{ t('done.total') }} <EarnedCounter :value="shownTotal" />
    </p>

    <div class="done__actions">
      <button class="btn btn-light btn-lg done__ok" type="button" :disabled="!canClose" @click="emit('close')">
        {{ t('done.ok') }}
      </button>
      <button class="btn btn-link done__undo" type="button" @click="emit('undo')">{{ t('done.undo') }}</button>
    </div>

    <span class="done__timer" aria-hidden="true" :style="{ animationDuration: `${AUTO_CLOSE_MS}ms` }" />
  </div>
</template>
