<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useChildrenStore } from '@/stores/children'

const route = useRoute()
const store = useChildrenStore()

onMounted(async () => {
  if (!store.children.length) await store.fetch()
})

const child = computed(() => store.byId(route.params.id as string))
</script>

<template>
  <main class="child">
    <RouterLink :to="{ name: 'profiles' }" class="btn btn-link">&larr; Back</RouterLink>
    <h1>{{ child?.name ?? '…' }}</h1>
    <p class="text-muted">Chore grid coming soon.</p>
  </main>
</template>
