<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

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
/** @type {import('vue').Ref<{ id: number, file: File, url: string }[]>} */
const newImageItems = ref([])
const existingImageUrls = ref([])
const formError = ref(null)
const fileInput = ref(null)
let nextNewImageId = 0

const isEdit = computed(() => props.product != null)
const title = computed(() => (isEdit.value ? 'Редактировать товар' : 'Новый товар'))

function revokeAllNewImageUrls() {
  for (const it of newImageItems.value) {
    if (it.url) {
      URL.revokeObjectURL(it.url)
    }
  }
  newImageItems.value = []
}

function buildExistingImageUrls() {
  const p = props.product
  if (!p) {
    return []
  }
  if (Array.isArray(p.image_urls) && p.image_urls.length) {
    return [...p.image_urls]
  }
  if (p.image_url) {
    return [p.image_url]
  }
  return []
}

function resetFromProduct() {
  formError.value = null
  revokeAllNewImageUrls()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  if (props.product) {
    name.value = props.product.name
    description.value = props.product.description ?? ''
    price.value = String(props.product.price)
    existingImageUrls.value = buildExistingImageUrls()
  } else {
    name.value = ''
    description.value = ''
    price.value = ''
    existingImageUrls.value = []
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
  const fileList = e.target.files
  if (!fileList?.length) {
    return
  }
  for (const file of fileList) {
    if (!file.type.startsWith('image/')) {
      continue
    }
    newImageItems.value = [
      ...newImageItems.value,
      { id: nextNewImageId++, file, url: URL.createObjectURL(file) },
    ]
  }
  e.target.value = ''
}

function removeNewImage(id) {
  const idx = newImageItems.value.findIndex((x) => x.id === id)
  if (idx === -1) {
    return
  }
  const [removed] = newImageItems.value.splice(idx, 1)
  URL.revokeObjectURL(removed.url)
}

function onSubmit() {
  formError.value = null
  if (!isEdit.value && newImageItems.value.length === 0) {
    formError.value = 'Выберите хотя бы одно изображение'
    return
  }
  emit('submit', {
    id: props.product?.id ?? null,
    name: name.value,
    description: description.value,
    price: price.value,
    imageFiles: newImageItems.value.map((x) => x.file),
  })
}

onBeforeUnmount(() => {
  revokeAllNewImageUrls()
})
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
            <label for="p-img">
              Изображения
              <span v-if="isEdit" class="field-label-muted">(необязательно, можно добавить ещё)</span>
            </label>
            <input
              id="p-img"
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              @change="onFileChange"
            />
            <p class="field-hint">Можно выбрать несколько файлов за раз.</p>
            <div v-if="existingImageUrls.length || newImageItems.length" class="preview-grid">
              <div
                v-for="(url, i) in existingImageUrls"
                :key="'ex-' + i"
                class="preview-item preview-item--existing"
              >
                <img :src="url" alt="Текущее фото" />
                <span class="preview-badge">Текущее</span>
              </div>
              <div v-for="it in newImageItems" :key="'new-' + it.id" class="preview-item">
                <img :src="it.url" alt="Новое фото" />
                <button
                  type="button"
                  class="preview-remove"
                  :aria-label="'Убрать изображение ' + it.file.name"
                  @click="removeNewImage(it.id)"
                >
                  ×
                </button>
              </div>
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

.field-label-muted {
  font-weight: 400;
  color: var(--muted);
  font-size: 0.875em;
}

.field-hint {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--muted);
}

.preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.preview-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg);
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  font-size: 0.65rem;
  line-height: 1.2;
  padding: 0.2rem 0.25rem;
  text-align: center;
  background: rgb(0 0 0 / 0.55);
  color: #fff;
}

.preview-remove {
  position: absolute;
  top: 0.2rem;
  right: 0.2rem;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: rgb(0 0 0 / 0.55);
  color: #fff;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-remove:hover {
  background: rgb(0 0 0 / 0.75);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
