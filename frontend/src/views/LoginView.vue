<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const remember = ref(false)
const error = ref(null)
const loading = ref(false)

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

async function onSubmit() {
  error.value = null
  loading.value = true
  try {
    await auth.login({
      email: email.value.trim(),
      password: password.value,
      remember: remember.value,
    })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    await router.push(redirect || { name: 'home' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось войти'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <h1 class="page-title">Вход</h1>
    <div class="card form-card">
      <form class="form" @submit.prevent="onSubmit">
        <p v-if="error" class="err" role="alert">{{ error }}</p>
        <div class="field">
          <label for="login-email">Email</label>
          <input
            id="login-email"
            v-model="email"
            class="input"
            type="email"
            name="email"
            required
            autocomplete="email"
            placeholder="you@example.com"
            :disabled="loading"
          />
        </div>
        <div class="field">
          <label for="login-password">Пароль</label>
          <input
            id="login-password"
            v-model="password"
            class="input"
            type="password"
            name="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            :disabled="loading"
          />
        </div>
        <div class="field field-inline">
          <input id="login-remember" v-model="remember" type="checkbox" class="check" :disabled="loading" />
          <label for="login-remember" class="check-label">Запомнить меня</label>
        </div>
        <div class="actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Вход…' : 'Войти' }}
          </button>
        </div>
        <p class="muted foot">
          Нет аккаунта?
          <RouterLink to="/register">Регистрация</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.form-card {
  max-width: 420px;
}

.form {
  margin: 0;
}

.field-inline {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.check {
  width: 1rem;
  height: 1rem;
}

.check-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
  margin: 0;
  cursor: pointer;
}

.actions {
  margin-top: 0.25rem;
}

.foot {
  margin: 1rem 0 0;
}
</style>
