import { fetchJson } from './client'

/**
 * @typedef {object} Product
 * @property {number} id
 * @property {string} name
 * @property {string|null} [description]
 * @property {string} price
 * @property {string|null} [image_url]
 * @property {string[]|null} [image_urls] несколько URL превью, если бэкенд отдаёт
 */

/**
 * @returns {Promise<Product[]>}
 */
export function fetchProducts() {
  return fetchJson('/api/products')
}

/**
 * @param {File} file
 * @returns {Promise<{ base64: string, filename: string }>}
 */
export function fileToImagePayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const s = reader.result
      resolve({
        base64: typeof s === 'string' ? s : '',
        filename: file.name,
      })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/**
 * @param {{ id: number|null, name: string, description: string, price: string, imageFile?: File|null, imageFiles?: File[] }} payload
 * @returns {Promise<unknown>}
 */
export async function saveProduct(payload) {
  const { id, name, description, price, imageFile, imageFiles } = payload

  const files = Array.isArray(imageFiles) && imageFiles.length
    ? imageFiles
    : imageFile
      ? [imageFile]
      : []

  /** @type {Record<string, unknown>} */
  const body = {
    name: String(name).trim(),
    description: String(description ?? '').trim() || null,
    price: Number(String(price).replace(',', '.')),
  }

  if (files.length) {
    const imagePayloads = await Promise.all(files.map((f) => fileToImagePayload(f)))
    body.images = imagePayloads
    body.image = imagePayloads[0]
  }

  if (id != null) {
    return fetchJson(`/api/products/${id}`, {
      method: 'PUT',
      body,
    })
  }

  if (!Array.isArray(body.images) || body.images.length === 0) {
    throw new Error('Выберите изображение')
  }

  return fetchJson('/api/products', {
    method: 'POST',
    body,
  })
}

/**
 * @param {number|string} id
 * @returns {Promise<void>}
 */
export function removeProduct(id) {
  return fetchJson(`/api/products/${id}`, {
    method: 'DELETE',
  }).then(() => {})
}
