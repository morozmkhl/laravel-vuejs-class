<script setup>
// Публичный каталог — позже сюда можно подключить список товаров с API.
</script>

<template>
  <div class="page">
    <h1 class="page-title">Каталог</h1>
    <div class="card catalog-card">
      <p class="lead">Здесь будет список товаров. Страница доступна без входа в аккаунт.</p>
      <p class="muted">
        Для приёма товаров с бэкенда подключите сюда существующий API (например, из раздела админки) или отдельный
        публичный маршрут.
      </p>
    </div>
  </div>
</template>

<style scoped>
.catalog-card {
  max-width: 40rem;
}

.lead {
  font-size: 1.05rem;
  margin: 0 0 0.75rem;
}
</style>
