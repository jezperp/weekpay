import { ref, watch } from 'vue'
import { i18n, systemLocale, type Locale } from '@/i18n'

export type LanguageMode = 'system' | Locale

const STORAGE_KEY = 'weekpay:language'

const stored = localStorage.getItem(STORAGE_KEY)
export const languageMode = ref<LanguageMode>(stored === 'sv' || stored === 'en' ? stored : 'system')

function apply() {
  const locale = languageMode.value === 'system' ? systemLocale() : languageMode.value
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
}

export function initLanguage() {
  apply()
  window.addEventListener('languagechange', apply) // follow the phone when mode is "system"
  watch(languageMode, (mode) => {
    if (mode === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, mode)
    apply()
  })
}
