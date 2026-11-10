<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const mode = ref<'signin' | 'signup'>('signin')
const error = ref('')
const info = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  info.value = ''
  loading.value = true
  try {
    if (mode.value === 'signin') {
      await auth.signIn(email.value, password.value)
      router.push({ name: 'profiles' })
    } else {
      await auth.signUp(email.value, password.value)
      info.value = 'Check your email to confirm your account.'
      mode.value = 'signin'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login">
    <form class="login__card card" @submit.prevent="submit">
      <h1 class="login__title">WeekPay</h1>
      <p class="text-muted">{{ mode === 'signin' ? 'Sign in to continue' : 'Create your account' }}</p>

      <div class="mb-3">
        <label class="form-label" for="email">Email</label>
        <input id="email" v-model="email" type="email" class="form-control" required autocomplete="email" />
      </div>
      <div class="mb-3">
        <label class="form-label" for="password">Password</label>
        <input id="password" v-model="password" type="password" class="form-control" required minlength="6"
          :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'" />
      </div>

      <p v-if="error" class="text-danger">{{ error }}</p>
      <p v-if="info" class="text-success">{{ info }}</p>

      <button class="btn btn-primary w-100" type="submit" :disabled="loading">
        {{ mode === 'signin' ? 'Sign in' : 'Sign up' }}
      </button>
      <button class="btn btn-link w-100 mt-2" type="button" @click="mode = mode === 'signin' ? 'signup' : 'signin'">
        {{ mode === 'signin' ? 'No account? Sign up' : 'Have an account? Sign in' }}
      </button>
    </form>
  </main>
</template>
