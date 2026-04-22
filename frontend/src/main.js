import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './pinia'
import { setUnauthorizedHandler } from './api/client'
import { useAuthStore } from './stores/auth'
import './assets/main.css'

const app = createApp(App)

if (import.meta.env.DEV) {
  app.config.errorHandler = (err, instance, info) => {
    console.error('[vue]', err, info, instance)
  }
}

app.use(pinia)

setUnauthorizedHandler(() => {
  useAuthStore(pinia).clearSession()
})

app.use(router)

const auth = useAuthStore(pinia)
void Promise.all([auth.initialize(), router.isReady()])
  .catch((e) => {
    console.error('[app] failed to init auth or router (mounting anyway)', e)
  })
  .finally(() => {
    app.mount('#app')
  })
