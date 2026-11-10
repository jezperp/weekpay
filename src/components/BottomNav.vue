<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Banknote, Coins, House, Settings } from 'lucide-vue-next'
import { useChildrenStore } from '@/stores/children'
import { useChoreLogsStore } from '@/stores/chorelogs'
import { formatKr } from '@/lib/format'
import EarnedCounter from '@/components/EarnedCounter.vue'

const route = useRoute()
const childrenStore = useChildrenStore()
const logsStore = useChoreLogsStore()
const childId = computed(() => route.params.id as string)
const child = computed(() => childrenStore.byId(childId.value))
</script>

<template>
  <nav class="nav" aria-label="Main">
    <RouterLink :to="{ name: 'profiles' }" class="nav__item" exact-active-class="nav__item--active">
      <House :size="22" />
      <span class="nav__label">Home</span>
    </RouterLink>

    <!-- Not built yet: shown but inactive -->
    <span class="nav__item nav__item--disabled" aria-disabled="true">
      <Banknote :size="22" />
      <span class="nav__label">Payout</span>
    </span>

    <RouterLink :to="{ name: 'child', params: { id: childId } }" class="nav__item nav__item--center"
      exact-active-class="nav__item--active" :aria-label="child ? `${child.name}'s chores` : 'Chores'">
      <span class="nav__avatar" :style="{ backgroundColor: child?.color ?? undefined }">
        {{ child?.name.charAt(0).toUpperCase() }}
      </span>
    </RouterLink>

    <!-- Shows the live total; becomes a link once the Earned page exists -->
    <span class="nav__item nav__item--earned" :aria-label="`Earned: ${formatKr(logsStore.balance)}`">
      <Coins :size="22" class="nav__coin" />
      <EarnedCounter class="nav__label" :value="logsStore.balance" />
    </span>

    <RouterLink :to="{ name: 'child-settings', params: { id: childId } }" class="nav__item"
      exact-active-class="nav__item--active">
      <Settings :size="22" />
      <span class="nav__label">Settings</span>
    </RouterLink>
  </nav>
</template>
