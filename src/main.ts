import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@fontsource-variable/fredoka' // self-hosted, no external font requests
import './assets/styles/main.scss'
import { initTheme } from './lib/theme'
import { initLanguage } from './lib/language'
import { i18n } from './i18n'

initTheme()
initLanguage()

createApp(App).use(createPinia()).use(router).use(i18n).mount('#app')
