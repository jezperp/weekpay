import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import sv from '@/locales/sv.json'

export type Locale = 'en' | 'sv'
export const LOCALES: Locale[] = ['sv', 'en']

// "System" = follow the phone: Swedish if it's set to Swedish, otherwise English.
export function systemLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('sv') ? 'sv' : 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: systemLocale(),
  fallbackLocale: 'en',
  messages: { en, sv },
})
