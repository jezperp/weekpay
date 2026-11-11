<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { iconFor } from '@/lib/icons'
import { formatKr } from '@/lib/format'
import type { Chore } from '@/stores/chores'

defineProps<{ chore: Chore | null }>()

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
</script>

<template>
  <template v-if="chore">
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <span class="detail__icon" :style="{ backgroundColor: chore.color ?? undefined }">
              <component :is="iconFor(chore.icon)" :size="22" />
            </span>
            <h2 class="modal-title h4 detail__title">{{ chore.name }}</h2>
            <button type="button" class="btn-close" :aria-label="t('common.close')" @click="emit('close')" />
          </div>
          <div class="modal-body">
            <p class="detail__price">{{ formatKr(chore.price) }}</p>
            <p v-if="chore.description" class="detail__description">{{ chore.description }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" />
  </template>
</template>
