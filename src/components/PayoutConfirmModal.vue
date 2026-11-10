<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatKr } from '@/lib/format'

defineProps<{
  open: boolean
  amount: number
  since: string // already formatted, e.g. "10 nov. 2026"
  saving: boolean
  error: string
}>()

const { t } = useI18n()
const emit = defineEmits<{ confirm: []; close: [] }>()
</script>

<template>
  <template v-if="open">
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h3">{{ t('payout.confirmTitle') }}</h2>
            <button type="button" class="btn-close" :aria-label="t('common.close')" @click="emit('close')" />
          </div>
          <div class="modal-body text-center">
            <p class="text-muted mb-1">{{ t('payout.paying') }}</p>
            <p class="payout__amount">{{ formatKr(amount) }}</p>
            <p class="text-muted mb-0">{{ t('payout.confirmBody', { date: since }) }}</p>
            <p v-if="error" class="text-danger mt-3 mb-0">{{ error }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" @click="emit('close')">{{ t('common.cancel') }}</button>
            <button type="button" class="btn btn-success" :disabled="saving" @click="emit('confirm')">
              {{ t('payout.confirmYes') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" />
  </template>
</template>
