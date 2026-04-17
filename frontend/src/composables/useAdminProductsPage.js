import { onMounted, ref, watch } from 'vue'
import { fetchProducts, removeProduct, saveProduct } from '../api/products'

/**
 * Состояние и действия страницы админки товаров (список + модалка).
 */
export function useAdminProductsPage() {
  const products = ref([])
  const loading = ref(true)
  const listError = ref(null)

  const modalOpen = ref(false)
  const editingProduct = ref(null)
  const saving = ref(false)
  const submitError = ref(null)

  async function load() {
    loading.value = true
    listError.value = null
    try {
      products.value = await fetchProducts()
    } catch (e) {
      listError.value = e instanceof Error ? e.message : 'Ошибка загрузки'
      products.value = []
    } finally {
      loading.value = false
    }
  }

  function openCreate() {
    editingProduct.value = null
    submitError.value = null
    modalOpen.value = true
  }

  function openEdit(product) {
    editingProduct.value = product
    submitError.value = null
    modalOpen.value = true
  }

  function setModalOpen(open) {
    modalOpen.value = open
  }

  watch(modalOpen, (open) => {
    if (!open) {
      editingProduct.value = null
      submitError.value = null
    }
  })

  async function onSubmit(payload) {
    submitError.value = null
    saving.value = true
    try {
      await saveProduct(payload)
      await load()
      setModalOpen(false)
    } catch (e) {
      submitError.value = e instanceof Error ? e.message : 'Не удалось сохранить'
    } finally {
      saving.value = false
    }
  }

  async function onDelete(product) {
    if (!window.confirm(`Удалить товар «${product.name}»?`)) {
      return
    }
    listError.value = null
    try {
      await removeProduct(product.id)
      await load()
    } catch (e) {
      listError.value = e instanceof Error ? e.message : 'Ошибка удаления'
    }
  }

  onMounted(load)

  return {
    products,
    loading,
    listError,
    modalOpen,
    editingProduct,
    saving,
    submitError,
    load,
    openCreate,
    openEdit,
    setModalOpen,
    onSubmit,
    onDelete,
  }
}
