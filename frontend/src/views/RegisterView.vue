<script setup>
function onSubmit() {
  /* логика регистрации будет добавлена позже */
}
</script>

<template>
  <div class="page">
    <h1 class="page-title">Регистрация</h1>
    <div class="card form-card">
      <form class="form" @submit.prevent="onSubmit">
        <div class="field">
          <label for="reg-name">Имя</label>
          <input
            id="reg-name"
            class="input"
            type="text"
            name="name"
            autocomplete="name"
            placeholder="Как к вам обращаться"
          />
        </div>
        <div class="field">
          <label for="reg-email">Email</label>
          <input
            id="reg-email"
            class="input"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div class="field">
          <label for="reg-password">Пароль</label>
          <input
            id="reg-password"
            class="input"
            type="password"
            name="password"
            autocomplete="new-password"
            placeholder="Не меньше 8 символов"
          />
        </div>
        <div class="field">
          <label for="reg-password-confirm">Подтверждение пароля</label>
          <input
            id="reg-password-confirm"
            class="input"
            type="password"
            name="password_confirmation"
            autocomplete="new-password"
            placeholder="Повторите пароль"
          />
        </div>
        <div class="actions">
          <button type="submit" class="btn btn-primary">Создать аккаунт</button>
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

.actions {
  margin-top: 0.25rem;
}

.foot {
  margin: 1rem 0 0;
}
</style>
