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
  return fetchJson('/api/admin/products')
}

/**
 * Публичный каталог: пагинация и фильтры.
 * @param {Record<string, string | number | undefined | null>} [query]
 * @returns {Promise<{ data: Product[], meta: { current_page: number, last_page: number, per_page: number, total: number, from: number | null, to: number | null }, links: Record<string, string | null>, price_bounds: { min: number, max: number } }>}
 */
export async function fetchProductCatalog(query = {}) {
  const u = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v == null || v === '') {
      continue
    }
    u.set(k, String(v))
  }
  const s = u.toString()
  const path = s ? `/api/products?${s}` : '/api/products'
  const json = await fetchJson(path, { public: true, unwrapData: false })
  if (!json || typeof json !== 'object') {
    return {
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 12, total: 0, from: null, to: null },
      links: {},
      price_bounds: { min: 0, max: 0 },
    }
  }
  const data = 'data' in json && Array.isArray(json.data) ? json.data : []
  const meta =
    'meta' in json && json.meta && typeof json.meta === 'object'
      ? /** @type {any} */ (json.meta)
      : { current_page: 1, last_page: 1, per_page: 12, total: 0, from: null, to: null }
  const links =
    'links' in json && json.links && typeof json.links === 'object' ? /** @type {any} */ (json.links) : {}
  const price_bounds =
    'price_bounds' in json && json.price_bounds && typeof json.price_bounds === 'object'
      ? /** @type {any} */ (json.price_bounds)
      : { min: 0, max: 0 }
  return { data, meta, links, price_bounds }
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
