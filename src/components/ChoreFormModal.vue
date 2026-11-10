<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, watch } from 'vue'
import { PALETTE } from '@/lib/palette'
import { ICONS, ICON_NAMES } from '@/lib/icons'
import type { Chore, ChoreInput } from '@/stores/chores'

const { t } = useI18n()
const props = defineProps<{
  open: boolean
  chore: Chore | null // null = add mode
  saving: boolean
  error: string
}>()

const emit = defineEmits<{
  save: [input: ChoreInput]
  archive: []
  close: []
}>()

const name = ref('')
const description = ref('')
const price = ref<number | null>(null)
const color = ref<string>(PALETTE[0])
const icon = ref<string>(ICON_NAMES[0])
const confirmingArchive = ref(false)

// Reset the form every time the modal opens.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.chore?.name ?? ''
    description.value = props.chore?.description ?? ''
    price.value = props.chore?.price ?? null
    color.value = props.chore?.color ?? PALETTE[Math.floor(Math.random() * PALETTE.length)]
    icon.value = props.chore?.icon ?? ICON_NAMES[0]
    confirmingArchive.value = false
  },
)

function submit() {
  const trimmed = name.value.trim()
  if (!trimmed || price.value === null || price.value < 0) return
  emit('save', {
    name: trimmed,
    description: description.value.trim() || null,
    price: price.value, color: color.value,
    icon: icon.value,
  })
}
</script>

<template>
  <template v-if="open">
    <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <form class="modal-content" @submit.prevent="submit">
          <div class="modal-header">
            <h2 class="modal-title h3">{{ chore ? t('choreForm.editTitle') : t('choreForm.addTitle') }}</h2>
            <button type="button" class="btn-close" :aria-label="t('common.close')" @click="emit('close')" />
          </div>

          <div class="modal-body">
            <div class="row g-3 mb-3">
              <div class="col-8">
                <label class="form-label" for="chore-name">{{ t('common.name') }}</label>
                <input id="chore-name" v-model="name" class="form-control form-control-lg" maxlength="80" required
                  autocomplete="off" />
              </div>
              <div class="col-4">
                <label class="form-label" for="chore-price">{{ t('choreForm.price') }}</label>
                <input id="chore-price" v-model.number="price" type="number" min="0" step="0.5" inputmode="decimal"
                  class="form-control form-control-lg" required />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label" for="chore-description">{{ t('choreForm.description') }}</label>
              <textarea id="chore-description" v-model="description" class="form-control" rows="2" maxlength="200" />
            </div>

            <fieldset class="mb-3">
              <legend class="form-label fs-6">{{ t('common.icon') }}</legend>
              <div class="icons">
                <button v-for="n in ICON_NAMES" :key="n" type="button" class="icons__item"
                  :class="{ 'icons__item--selected': n === icon }" :aria-label="n" :aria-pressed="n === icon"
                  @click="icon = n">
                  <component :is="ICONS[n]" :size="26" />
                </button>
              </div>
            </fieldset>

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
              <template v-if="chore">
                <button v-if="!confirmingArchive" type="button" class="btn btn-outline-danger"
                  @click="confirmingArchive = true">
                  {{ t('choreForm.remove') }}
                </button>
                <button v-else type="button" class="btn btn-danger" :disabled="saving" @click="emit('archive')">
                  {{ t('choreForm.reallyRemove') }}
                </button>
              </template>
            </div>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-light" @click="emit('close')">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn btn-primary" :disabled="saving || !name.trim() || price === null">
                {{ t('common.save') }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    <div class="modal-backdrop fade show" />
  </template>
</template>
