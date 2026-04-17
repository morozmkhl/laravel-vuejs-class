<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  /** null — создание; иначе редактирование */
  product: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  /** Ошибка с бэкенда после неуспешного сохранения */
  submitError: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:open', 'submit'])

const name = ref('')
const description = ref('')
const price = ref('')
const imageFile = ref(null)
const imagePreview = ref(null)
const formError = ref(null)
const fileInput = ref(null)

const isEdit = computed(() => props.product != null)
const title = computed(() => (isEdit.value ? 'Редактировать товар' : 'Новый товар'))

function resetFromProduct() {
  formError.value = null
  imageFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  if (props.product) {
    name.value = props.product.name
    description.value = props.product.description ?? ''
    price.value = String(props.product.price)
    imagePreview.value = props.product.image_url ?? null
  } else {
    name.value = ''
    description.value = ''
    price.value = ''
    imagePreview.value = null
  }
}

watch(
  () => [props.open, props.product],
  () => {
    if (props.open) {
      resetFromProduct()
    }
  },
  { flush: 'post' },
)

function close() {
  emit('update:open', false)
}

function onFileChange(e) {
  const file = e.target.files?.[0] ?? null
  imageFile.value = file
  if (imagePreview.value && String(imagePreview.value).startsWith('blob:')) {
    URL.revokeObjectURL(imagePreview.value)
  }
  imagePreview.value = file ? URL.createObjectURL(file) : props.product?.image_url ?? null
}

function onSubmit() {
  formError.value = null
  if (!isEdit.value && !imageFile.value) {
    formError.value = 'Выберите изображение'
    return
  }
  emit('submit', {
    id: props.product?.id ?? null,
    name: name.value,
    description: description.value,
    price: price.value,
    imageFile: imageFile.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="backdrop" @click.self="close">
      <div
        class="modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        <h2 id="product-modal-title" class="modal-title">{{ title }}</h2>
        <form class="modal-form" @submit.prevent="onSubmit">
          <div v-if="formError || submitError" class="err">{{ formError || submitError }}</div>
          <div class="field">
            <label for="p-name">Название</label>
            <input id="p-name" v-model="name" class="input" required maxlength="255" />
          </div>
          <div class="field">
            <label for="p-desc">Описание</label>
            <textarea id="p-desc" v-model="description" class="input textarea" rows="3" />
          </div>
          <div class="field">
            <label for="p-price">Цена</label>
            <input
              id="p-price"
              v-model="price"
              class="input"
              type="text"
              inputmode="decimal"
              required
              placeholder="0.00"
            />
          </div>
          <div class="field">
            <label for="p-img">Изображение {{ isEdit ? '(необязательно)' : '' }}</label>
            <input
              id="p-img"
              ref="fileInput"
              type="file"
              accept="image/*"
              :required="!isEdit"
              @change="onFileChange"
            />
            <div v-if="imagePreview" class="preview">
              <img :src="imagePreview" alt="Предпросмотр" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" :disabled="saving" @click="close">
              Отмена
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Сохранение…' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.45);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1rem;
  z-index: 50;
  overflow: auto;
}

.modal {
  width: min(100%, 440px);
  margin-bottom: 2rem;
}

.modal-title {
  margin: 0 0 1rem;
  font-size: 1.25rem;
}

.modal-form {
  margin: 0;
}

.textarea {
  min-height: 5rem;
  resize: vertical;
}

.preview {
  margin-top: 0.5rem;
}

.preview img {
  max-width: 100%;
  max-height: 180px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
