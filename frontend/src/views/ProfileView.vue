<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const user = computed(() => auth.user)

const emailVerified = computed(() => {
  const u = user.value
  if (!u) return null
  const v = 'email_verified_at' in u ? u.email_verified_at : null
  if (v == null) return 'не подтверждён'
  const d = typeof v === 'string' ? new Date(v) : v instanceof Date ? v : null
  if (d && !Number.isNaN(d.getTime())) {
    return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
  }
  return String(v)
})
</script>

<template>
  <div class="page">
    <h1 class="page-title">Профиль</h1>
    <div v-if="user" class="card profile-card">
      <p class="lead">Данные текущей учётной записи (из сессии / API).</p>
      <dl class="fields">
        <div class="row">
          <dt>ID</dt>
          <dd>{{ user.id }}</dd>
        </div>
        <div class="row">
          <dt>Имя</dt>
          <dd>{{ user.name }}</dd>
        </div>
        <div class="row">
          <dt>Email</dt>
          <dd>{{ user.email }}</dd>
        </div>
        <div v-if="'email_verified_at' in user" class="row">
          <dt>Email подтверждён</dt>
          <dd>{{ emailVerified }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.profile-card {
  max-width: 32rem;
}

.lead {
  font-size: 0.9375rem;
  color: var(--muted, #71717a);
  margin: 0 0 1.25rem;
}

.fields {
  margin: 0;
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 10rem) 1fr;
  gap: 0.5rem 1.25rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--border, #e4e4e7);
  font-size: 0.9375rem;
}

.row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

dt {
  margin: 0;
  color: var(--muted, #71717a);
  font-weight: 500;
}

dd {
  margin: 0;
  color: var(--text, #18181b);
  word-break: break-word;
}
</style>
