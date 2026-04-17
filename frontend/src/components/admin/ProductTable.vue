<script setup>
import { formatPriceRub, clipText } from '../../utils/format'

defineProps({
  products: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['edit', 'delete'])
</script>

<template>
  <div v-if="loading" class="muted">Загрузка…</div>

  <div v-else class="card table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th class="col-img" />
          <th>Название</th>
          <th class="hide-sm">Описание</th>
          <th>Цена</th>
          <th class="col-actions" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in products" :key="p.id">
          <td>
            <div class="thumb">
              <img v-if="p.image_url" :src="p.image_url" alt="" />
              <span v-else class="thumb-ph">Нет фото</span>
            </div>
          </td>
          <td class="name">{{ p.name }}</td>
          <td class="hide-sm desc">{{ clipText(p.description) }}</td>
          <td class="price">{{ formatPriceRub(p.price) }}</td>
          <td class="actions">
            <button type="button" class="btn btn-ghost btn-sm" @click="$emit('edit', p)">
              Изменить
            </button>
            <button type="button" class="btn btn-danger btn-sm" @click="$emit('delete', p)">
              Удалить
            </button>
          </td>
        </tr>
        <tr v-if="products.length === 0">
          <td colspan="5" class="empty">Пока нет товаров — нажмите «Добавить товар».</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrap {
  padding: 0;
  overflow: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}

.table th,
.table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  text-align: left;
}

.table th {
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--muted);
  font-weight: 600;
}

.col-img {
  width: 88px;
}

.col-actions {
  width: 220px;
  text-align: right !important;
}

.thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-ph {
  font-size: 0.65rem;
  color: var(--muted);
  padding: 0.25rem;
  text-align: center;
}

.name {
  font-weight: 500;
}

.desc {
  color: var(--muted);
  max-width: 320px;
}

.price {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-sm {
  padding: 0.35rem 0.65rem;
  font-size: 0.8125rem;
}

.empty {
  text-align: center;
  color: var(--muted);
  padding: 2rem 1rem !important;
}

.hide-sm {
  display: none;
}

@media (min-width: 768px) {
  .hide-sm {
    display: table-cell;
  }
}
</style>
