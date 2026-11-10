<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  open: boolean
  childName: string
  saving: boolean
  error: string
}>()

const emit = defineEmits<{ confirm: []; close: [] }>()

const { t } = useI18n()

const typed = ref('')
const word = computed(() => t('reset.word'))
const confirmed = computed(() => typed.value.trim().toLowerCase() === word.value.toLowerCase())

watch(
  () => props.open,
  (open) => {
    if (open) typed.value = ''
  },
)
</script>

<template>
  <template v-if="open">
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal-dialog modal-dialog-centered">
        <form class="modal-content" @submit.prevent="confirmed && emit('confirm')">
          <div class="modal-header">
            <h2 class="modal-title h3 text-danger">{{ t('reset.title') }}</h2>
            <button type="button" class="btn-close" :aria-label="t('common.close')" @click="emit('close')" />
          </div>

          <div class="modal-body">
            <p>{{ t('reset.warning', { name: childName }) }}</p>
            <label class="form-label" for="reset-confirm">
              {{ t('reset.typePrompt') }} <strong>{{ word }}</strong>
            </label>
            <input id="reset-confirm" v-model="typed" class="form-control form-control-lg" autocomplete="off"
              autocapitalize="off" spellcheck="false" />
            <p v-if="error" class="text-danger mt-3 mb-0">{{ error }}</p>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-light" @click="emit('close')">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn btn-danger" :disabled="!confirmed || saving">
              {{ t('reset.confirm') }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <div class="modal-backdrop fade show" />
  </template>
</template>
