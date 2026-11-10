import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/main.scss'
import { initTheme } from './lib/theme'

initTheme()

createApp(App).use(createPinia()).use(router).mount('#app')
