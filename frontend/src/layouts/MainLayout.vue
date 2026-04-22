<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const userLabel = computed(() => (auth.user ? auth.user.name || auth.user.email : ''))

async function onLogout() {
  await auth.logout()
  if (router.currentRoute.value.matched.some((m) => m.meta.requiresAuth)) {
    await router.push({ name: 'home' })
  }
}
</script>

<template>
  <div class="shell">
    <header class="header">
      <div class="header-inner">
        <RouterLink to="/" class="logo">Vue + Laravel</RouterLink>
        <nav class="nav" aria-label="Основное меню">
          <RouterLink class="nav-link" to="/catalog">Каталог</RouterLink>
          <template v-if="!auth.isAuthenticated">
            <RouterLink class="nav-link" to="/login">Вход</RouterLink>
            <RouterLink class="nav-link" to="/register">Регистрация</RouterLink>
          </template>
          <template v-else>
            <RouterLink class="nav-link" to="/profile">Профиль</RouterLink>
            <span class="user-pill" :title="userLabel">{{ userLabel }}</span>
            <button type="button" class="nav-link nav-btn" @click="onLogout">Выйти</button>
          </template>
          <RouterLink class="nav-link nav-accent" to="/admin">Админ-панель</RouterLink>
        </nav>
      </div>
    </header>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: var(--surface, #fff);
  border-bottom: 1px solid var(--border, #e4e4e7);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0.85rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.logo {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--text, #18181b);
  text-decoration: none;
}

.logo:hover {
  text-decoration: none;
  color: var(--accent, #4f46e5);
}

.nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 1rem;
}

.nav-link {
  color: var(--muted, #71717a);
  font-size: 0.9375rem;
  font-weight: 500;
  text-decoration: none;
  padding: 0.35rem 0;
}

.nav-link:hover {
  color: var(--text, #18181b);
  text-decoration: none;
}

.nav-link.router-link-active {
  color: var(--accent, #4f46e5);
}

.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
}

.user-pill {
  max-width: 10rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.875rem;
  color: var(--text, #18181b);
  background: var(--bg, #f4f4f5);
  border-radius: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-accent {
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  background: rgb(79 70 229 / 0.08);
  color: var(--accent, #4f46e5) !important;
}

.nav-accent.router-link-active {
  background: rgb(79 70 229 / 0.15);
}

.main {
  flex: 1;
}
</style>
