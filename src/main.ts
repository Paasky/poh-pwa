import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import '@fontsource/poiret-one/400.css'

// Font Awesome setup
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
    faBars,
    faBookOpen,
    faCircleQuestion,
    faMagnifyingGlass,
    faXmark
} from '@fortawesome/free-solid-svg-icons'

library.add(
    faBars,
    faBookOpen,
    faCircleQuestion,
    faMagnifyingGlass,
    faXmark
)

// PWA service worker registration (auto updates)
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
