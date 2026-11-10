import { ref, watch } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'weekpay:theme'

const stored = localStorage.getItem(STORAGE_KEY)
export const themeMode = ref<ThemeMode>(stored === 'light' || stored === 'dark' ? stored : 'system')

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')

// Bootstrap 5.3 switches palettes via data-bs-theme on <html>.
function apply() {
  const dark = themeMode.value === 'dark' || (themeMode.value === 'system' && prefersDark.matches)
  document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light')
}

export function initTheme() {
  apply()
  prefersDark.addEventListener('change', apply) // follow the phone when mode is "system"
  watch(themeMode, (mode) => {
    if (mode === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, mode)
    apply()
  })
}
