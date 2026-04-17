<script setup>
function onSubmit() {
  /* логика входа будет добавлена позже */
}
</script>

<template>
  <div class="page">
    <h1 class="page-title">Вход</h1>
    <div class="card form-card">
      <form class="form" @submit.prevent="onSubmit">
        <div class="field">
          <label for="login-email">Email</label>
          <input
            id="login-email"
            class="input"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div class="field">
          <label for="login-password">Пароль</label>
          <input
            id="login-password"
            class="input"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="••••••••"
          />
        </div>
        <div class="actions">
          <button type="submit" class="btn btn-primary">Войти</button>
        </div>
        <p class="muted foot">Пока без логики — только вёрстка формы.</p>
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

.actions {
  margin-top: 0.25rem;
}

.foot {
  margin: 1rem 0 0;
}
</style>
