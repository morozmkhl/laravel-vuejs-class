<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref(null)
const loading = ref(false)

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

async function onSubmit() {
  error.value = null
  if (password.value.length < 8) {
    error.value = 'Пароль: не меньше 8 символов'
    return
  }
  if (password.value !== passwordConfirm.value) {
    error.value = 'Пароли не совпадают'
    return
  }

  loading.value = true
  try {
    await auth.register({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
      password_confirmation: passwordConfirm.value,
    })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    await router.push(redirect || { name: 'home' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось зарегистрироваться'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <h1 class="page-title">Регистрация</h1>
    <div class="card form-card">
      <form class="form" @submit.prevent="onSubmit">
        <p v-if="error" class="err" role="alert">{{ error }}</p>
        <div class="field">
          <label for="reg-name">Имя</label>
          <input
            id="reg-name"
            v-model="name"
            class="input"
            type="text"
            name="name"
            required
            autocomplete="name"
            placeholder="Как к вам обращаться"
            :disabled="loading"
          />
        </div>
        <div class="field">
          <label for="reg-email">Email</label>
          <input
            id="reg-email"
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
          <label for="reg-password">Пароль</label>
          <input
            id="reg-password"
            v-model="password"
            class="input"
            type="password"
            name="password"
            required
            autocomplete="new-password"
            placeholder="Не меньше 8 символов"
            minlength="8"
            :disabled="loading"
          />
        </div>
        <div class="field">
          <label for="reg-password-confirm">Подтверждение пароля</label>
          <input
            id="reg-password-confirm"
            v-model="passwordConfirm"
            class="input"
            type="password"
            name="password_confirmation"
            required
            autocomplete="new-password"
            placeholder="Повторите пароль"
            minlength="8"
            :disabled="loading"
          />
        </div>
        <div class="actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Создание…' : 'Создать аккаунт' }}
          </button>
        </div>
        <p class="muted foot">
          Уже есть аккаунт?
          <RouterLink to="/login">Войти</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.form-card {
  max-width: 420px;
}

.actions {
  margin-top: 0.25rem;
}

.foot {
  margin: 1rem 0 0;
}
</style>
