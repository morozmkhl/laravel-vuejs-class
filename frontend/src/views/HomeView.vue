<script setup>
import { onMounted, ref } from 'vue'
import { fetchJson } from '../api/client'

const message = ref('Загрузка…')
const error = ref(null)

onMounted(async () => {
  try {
    const data = await fetchJson('/api/hello')
    message.value =
      data && typeof data === 'object' && 'message' in data
        ? String(data.message)
        : JSON.stringify(data)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка запроса'
    message.value = ''
  }
})
</script>

<template>
  <div class="page">
    <h1 class="page-title">Главная</h1>
    <div class="card intro">
      <p v-if="error" class="err">{{ error }}</p>
      <template v-else>
        <p class="lead">{{ message }}</p>
        <p class="muted">
          Фронтенд и API разделены: меню сверху, админка — в разделе «Админ-панель».
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.intro {
  max-width: 36rem;
}

.lead {
  font-size: 1.125rem;
  margin: 0 0 0.75rem;
}
</style>
