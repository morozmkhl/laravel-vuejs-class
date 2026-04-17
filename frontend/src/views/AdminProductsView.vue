<script setup>
import ProductFormModal from '../components/admin/ProductFormModal.vue'
import ProductTable from '../components/admin/ProductTable.vue'
import { useAdminProductsPage } from '../composables/useAdminProductsPage'

const {
  products,
  loading,
  listError,
  modalOpen,
  editingProduct,
  saving,
  submitError,
  openCreate,
  openEdit,
  setModalOpen,
  onSubmit,
  onDelete,
} = useAdminProductsPage()
</script>

<template>
  <div class="page admin">
    <div class="head">
      <h1 class="page-title">Админ-панель · Товары</h1>
      <button type="button" class="btn btn-primary" @click="openCreate">Добавить товар</button>
    </div>

    <p v-if="listError" class="err banner">{{ listError }}</p>

    <ProductTable
      :products="products"
      :loading="loading"
      @edit="openEdit"
      @delete="onDelete"
    />

    <ProductFormModal
      :open="modalOpen"
      :product="editingProduct"
      :saving="saving"
      :submit-error="submitError"
      @update:open="setModalOpen"
      @submit="onSubmit"
    />
  </div>
</template>

<style scoped>
.admin {
  max-width: 1100px;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.banner {
  margin: 0 0 1rem;
}
</style>
