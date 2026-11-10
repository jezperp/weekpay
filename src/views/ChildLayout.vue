<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useChildrenStore } from '@/stores/children'
import { useChoreLogsStore } from '@/stores/chorelogs'
import BottomNav from '@/components/BottomNav.vue'

const route = useRoute()
const childrenStore = useChildrenStore()
const logsStore = useChoreLogsStore()

const childId = route.params.id as string
// Drop the previous child's logs right away so the nav never shows the wrong balance.
logsStore.reset(childId)

// The nav shows the earned total on every child page, so the logs are loaded here
// (also covers deep links / reloads).
onMounted(() => {
  if (!childrenStore.children.length) childrenStore.fetch().catch(() => {})
  logsStore.fetch(childId).catch(() => {})
})
</script>

<template>
  <main class="child-layout">
    <RouterView />
    <BottomNav />
  </main>
</template>
