<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  await auth.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <main class="profiles">
    <h1 class="profiles__title">Who's earning today?</h1>
    <p class="text-muted">Child profiles coming soon.</p>
    <button class="btn btn-outline-secondary" @click="logout">Sign out</button>
  </main>
</template>
