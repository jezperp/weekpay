<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, watch } from 'vue'
import { PALETTE } from '@/lib/palette'
import type { Child, ChildInput } from '@/stores/children'

const { t } = useI18n()
const props = defineProps<{
  open: boolean
  child: Child | null // null = add mode
  saving: boolean
  error: string
}>()

const emit = defineEmits<{
  save: [input: ChildInput]
  remove: []
  close: []
}>()

const name = ref('')
const color = ref<string>(PALETTE[0])
const confirmingDelete = ref(false)

// Reset the form every time the modal opens.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.child?.name ?? ''
    color.value = props.child?.color ?? PALETTE[Math.floor(Math.random() * PALETTE.length)]
    confirmingDelete.value = false
  },
)

function submit() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  emit('save', { name: trimmed, color: color.value })
}
</script>

<template>
  <template v-if="open">
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal-dialog modal-dialog-centered">
        <form class="modal-content" @submit.prevent="submit">
          <div class="modal-header">
            <h2 class="modal-title h3">{{ child ? t('childForm.editTitle') : t('childForm.addTitle') }}</h2>
            <button type="button" class="btn-close" :aria-label="t('common.close')" @click="emit('close')" />
          </div>

          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label" for="child-name">{{ t('common.name') }}</label>
              <input id="child-name" v-model="name" class="form-control form-control-lg" maxlength="50" required
                autofocus autocomplete="off" />
            </div>

            <fieldset>
              <legend class="form-label fs-6">{{ t('common.color') }}</legend>
              <div class="swatches">
                <button v-for="c in PALETTE" :key="c" type="button" class="swatch"
                  :class="{ 'swatch--selected': c === color }" :style="{ backgroundColor: c }"
                  :aria-label="t('common.colorN', { color: c })" :aria-pressed="c === color" @click="color = c" />
              </div>
            </fieldset>

            <p v-if="error" class="text-danger mt-3 mb-0">{{ error }}</p>
          </div>

          <div class="modal-footer justify-content-between">
            <div>
              <template v-if="child">
                <button v-if="!confirmingDelete" type="button" class="btn btn-outline-danger"
                  @click="confirmingDelete = true">
                  {{ t('childForm.delete') }}
                </button>
                <button v-else type="button" class="btn btn-danger" :disabled="saving" @click="emit('remove')">
                  {{ t('childForm.reallyDelete') }}
                </button>
              </template>
            </div>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-light" @click="emit('close')">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn btn-primary" :disabled="saving || !name.trim()">{{ t('common.save') }}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
    <div class="modal-backdrop fade show" />
  </template>
</template>
