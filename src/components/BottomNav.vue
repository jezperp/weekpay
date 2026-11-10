<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Banknote, Coins, Settings, Users } from 'lucide-vue-next'
import { useChildrenStore } from '@/stores/children'
import { useChoreLogsStore } from '@/stores/chorelogs'
import { formatKr } from '@/lib/format'
import EarnedCounter from '@/components/EarnedCounter.vue'

const { t } = useI18n()
const route = useRoute()
const childrenStore = useChildrenStore()
const logsStore = useChoreLogsStore()
const childId = computed(() => route.params.id as string)
const child = computed(() => childrenStore.byId(childId.value))
</script>

<template>
  <nav class="nav" :aria-label="t('nav.main')">
    <RouterLink :to="{ name: 'profiles' }" class="nav__item" exact-active-class="nav__item--active">
      <Users :size="22" />
      <span class="nav__label">{{ t('nav.switchProfile') }}</span>
    </RouterLink>

    <RouterLink :to="{ name: 'child-payout', params: { id: childId } }" class="nav__item"
      exact-active-class="nav__item--active">
      <Banknote :size="22" />
      <span class="nav__label">{{ t('nav.payout') }}</span>
    </RouterLink>

    <RouterLink :to="{ name: 'child', params: { id: childId } }" class="nav__item nav__item--center"
      exact-active-class="nav__item--active" :aria-label="child ? t('nav.childChoresAria', { name: child.name }) : t('nav.choresAria')">
      <span class="nav__avatar" :style="{ backgroundColor: child?.color ?? undefined }">
        {{ child?.name.charAt(0).toUpperCase() }}
      </span>
      <span class="nav__label">{{ child?.name }}</span>
    </RouterLink>

    <RouterLink :to="{ name: 'child-earned', params: { id: childId } }" class="nav__item"
      exact-active-class="nav__item--active" :aria-label="t('nav.earnedAria', { amount: formatKr(logsStore.balance) })">
      <Coins :size="22" class="nav__coin" />
      <EarnedCounter class="nav__label" :value="logsStore.balance" />
    </RouterLink>

    <RouterLink :to="{ name: 'child-settings', params: { id: childId } }" class="nav__item"
      exact-active-class="nav__item--active">
      <Settings :size="22" />
      <span class="nav__label">{{ t('nav.settings') }}</span>
    </RouterLink>
  </nav>
</template>
