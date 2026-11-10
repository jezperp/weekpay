<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { formatKr } from '@/lib/format'

const props = defineProps<{ value: number }>()

const shown = ref(props.value)
const bump = ref<'up' | 'down' | null>(null)
let raf = 0

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

// Whole kronor while counting, the exact value once it lands.
const display = computed(() => formatKr(shown.value === props.value ? props.value : Math.round(shown.value)))

watch(
  () => props.value,
  (to, from) => {
    cancelAnimationFrame(raf)

    // Restart the bump animation even if the previous one is still running.
    bump.value = null
    requestAnimationFrame(() => {
      bump.value = to > from ? 'up' : 'down'
    })

    if (reduceMotion.matches) {
      shown.value = to
      return
    }

    const startValue = shown.value
    const startTime = performance.now()
    const duration = 400
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out
      shown.value = t < 1 ? startValue + (to - startValue) * eased : to
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  },
)

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <span class="earned__amount" :class="bump && `earned__amount--${bump}`" @animationend="bump = null">
    {{ display }}
  </span>
</template>
