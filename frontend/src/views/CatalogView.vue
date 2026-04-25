<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchProductCatalog } from '../api/products'
import { formatPriceRub, clipText } from '../utils/format'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(null)
const items = ref([])
/** @type {import('vue').Ref<{ current_page: number, last_page: number, per_page: number, total: number, from: number | null, to: number | null } | null>} */
const meta = ref(null)
const priceBounds = ref({ min: 0, max: 0 })

/** Локальные поля фильтра при ручном вводе */
const filterMin = ref('')
const filterMax = ref('')

const pageTitleId = 'catalog-heading'
const resultsId = 'catalog-results'

function parseQueryNum(name) {
  const v = route.query[name]
  if (v == null || v === '') {
    return null
  }
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function queryToRequest() {
  const page = Math.max(1, parseInt(String(route.query.page || '1'), 10) || 1)
  const sort = ['newest', 'price_asc', 'price_desc'].includes(String(route.query.sort))
    ? String(route.query.sort)
    : 'newest'
  const allowedPer = [12, 24, 36]
  const perRaw = parseInt(String(route.query.per_page || '12'), 10)
  const per_page = allowedPer.includes(perRaw) ? perRaw : 12

  /** @type {Record<string, string | number>} */
  const q = { page, sort, per_page }
  const minP = parseQueryNum('min_price')
  const maxP = parseQueryNum('max_price')
  if (minP != null) {
    q.min_price = minP
  }
  if (maxP != null) {
    q.max_price = maxP
  }
  return q
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const req = queryToRequest()
    const res = await fetchProductCatalog(req)
    items.value = res.data
    meta.value = res.meta
    priceBounds.value = res.price_bounds
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить каталог'
    items.value = []
    meta.value = null
  } finally {
    loading.value = false
  }
}

function syncFiltersFromRoute() {
  const minP = parseQueryNum('min_price')
  const maxP = parseQueryNum('max_price')
  filterMin.value = minP != null ? String(minP) : ''
  filterMax.value = maxP != null ? String(maxP) : ''
}

function applyFilters() {
  const next = { ...route.query, page: '1' }
  const minStr = String(filterMin.value).trim().replace(',', '.')
  const maxStr = String(filterMax.value).trim().replace(',', '.')
  if (minStr === '') {
    delete next.min_price
  } else {
    next.min_price = minStr
  }
  if (maxStr === '') {
    delete next.max_price
  } else {
    next.max_price = maxStr
  }
  router.push({ query: next })
}

function clearFilters() {
  filterMin.value = ''
  filterMax.value = ''
  const next = { ...route.query }
  delete next.min_price
  delete next.max_price
  next.page = '1'
  router.push({ query: next })
}

function setSort(sort) {
  router.push({ query: { ...route.query, sort, page: '1' } })
}

/**
 * @param {Event} ev
 */
function onSortChange(ev) {
  const t = ev.target
  if (t && 'value' in t) {
    setSort(String(/** @type {HTMLSelectElement} */ (t).value))
  }
}

function setPerPage(n) {
  router.push({ query: { ...route.query, per_page: String(n), page: '1' } })
}

function goToPage(n) {
  if (n < 1 || (meta.value && n > meta.value.last_page)) {
    return
  }
  router.push({ query: { ...route.query, page: String(n) } })
}

const resultSummary = computed(() => {
  const m = meta.value
  if (!m || m.total === 0) {
    return 'Товаров не найдено'
  }
  const from = m.from ?? 0
  const to = m.to ?? 0
  return `Показано ${from}–${to} из ${m.total}`
})

const currentSort = computed(() =>
  ['newest', 'price_asc', 'price_desc'].includes(String(route.query.sort))
    ? String(route.query.sort)
    : 'newest',
)

const currentPerPage = computed(() => {
  const allowed = [12, 24, 36]
  const v = parseInt(String(route.query.per_page || '12'), 10)
  return allowed.includes(v) ? v : 12
})

const currentPage = computed(() => {
  const p = parseInt(String(route.query.page || '1'), 10)
  return Number.isFinite(p) && p > 0 ? p : 1
})

const pageNumbers = computed(() => {
  const m = meta.value
  if (!m || m.last_page <= 1) {
    return []
  }
  const cur = m.current_page
  const last = m.last_page
  const windowSize = 5
  let start = Math.max(1, cur - Math.floor(windowSize / 2))
  let end = Math.min(last, start + windowSize - 1)
  start = Math.max(1, end - windowSize + 1)
  const nums = []
  for (let i = start; i <= end; i += 1) {
    nums.push(i)
  }
  return nums
})

const boundsHint = computed(() => {
  const b = priceBounds.value
  if (b.min === 0 && b.max === 0) {
    return null
  }
  return `В каталоге цены от ${formatPriceRub(b.min)} до ${formatPriceRub(b.max)}`
})

watch(
  () => route.query,
  () => {
    syncFiltersFromRoute()
    load()
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <div class="page page-catalog">
    <header class="catalog-header">
      <h1 :id="pageTitleId" class="page-title">Каталог</h1>
      <p v-if="boundsHint" class="bounds-hint muted">{{ boundsHint }}</p>
    </header>

    <div class="catalog-layout">
      <aside class="filters card" aria-labelledby="filters-title">
        <h2 id="filters-title" class="filters-title">Фильтры</h2>
        <form class="filter-form" @submit.prevent="applyFilters">
          <div class="field">
            <label for="filter-min">Цена от, ₽</label>
            <input
              id="filter-min"
              v-model="filterMin"
              class="input"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="Нет нижнего предела"
              aria-describedby="filter-price-help"
            />
          </div>
          <div class="field">
            <label for="filter-max">Цена до, ₽</label>
            <input
              id="filter-max"
              v-model="filterMax"
              class="input"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="Нет верхнего предела"
            />
          </div>
          <p id="filter-price-help" class="muted filter-help">
            Оставьте поле пустым, чтобы не ограничивать каталог с этой стороны.
          </p>
          <div class="filter-actions">
            <button type="submit" class="btn btn-primary">Применить</button>
            <button type="button" class="btn btn-ghost" @click="clearFilters">Сбросить цену</button>
          </div>
        </form>

        <div class="field filter-field">
          <label for="catalog-sort">Сортировка</label>
          <select
            id="catalog-sort"
            class="input select-input"
            :value="currentSort"
            @change="onSortChange"
          >
            <option value="newest">Сначала новые</option>
            <option value="price_asc">По цене: дешевле</option>
            <option value="price_desc">По цене: дороже</option>
          </select>
        </div>

        <div class="field filter-field">
          <span id="per-page-label" class="label-block">На странице</span>
          <div class="per-page" role="group" aria-labelledby="per-page-label">
            <button
              v-for="n in [12, 24, 36]"
              :key="n"
              type="button"
              class="per-page-btn"
              :class="{ active: currentPerPage === n }"
              :aria-pressed="currentPerPage === n"
              @click="setPerPage(n)"
            >
              {{ n }}
            </button>
          </div>
        </div>
      </aside>

      <section class="catalog-main" :aria-labelledby="pageTitleId">
        <p :id="resultsId" class="sr-only" aria-live="polite" aria-atomic="true">
          {{ loading ? 'Загрузка списка товаров' : resultSummary }}
        </p>
        <p class="result-line" aria-hidden="true">
          <span v-if="loading" class="muted">Загрузка…</span>
          <template v-else>{{ resultSummary }}</template>
        </p>

        <p v-if="error" class="err catalog-err" role="alert">{{ error }}</p>

        <ul v-else-if="!loading && items.length === 0" class="empty-state card">
          <li class="empty-title">По заданным условиям ничего не найдено</li>
          <li class="muted">Попробуйте изменить диапазон цены или сбросить фильтр.</li>
        </ul>

        <ul v-else class="product-grid">
          <li v-for="p in items" :key="p.id" class="product-card card">
            <div class="product-media">
              <img
                v-if="p.image_url"
                class="product-img"
                :src="p.image_url"
                :alt="`Фото товара ${p.name}`"
                loading="lazy"
                decoding="async"
                width="400"
                height="300"
              />
              <div v-else class="product-img product-img--placeholder" role="img" :aria-label="`Нет фото: ${p.name}`">
                <span class="placeholder-text" aria-hidden="true">Нет фото</span>
              </div>
            </div>
            <div class="product-body">
              <h3 class="product-name">{{ p.name }}</h3>
              <p v-if="p.description" class="product-desc muted">{{ clipText(p.description, 120) }}</p>
              <p class="product-price">{{ formatPriceRub(p.price) }}</p>
            </div>
          </li>
        </ul>

        <nav
          v-if="meta && meta.last_page > 1 && !loading"
          class="pagination"
          aria-label="Страницы каталога"
        >
          <button
            type="button"
            class="btn btn-ghost page-nav"
            :disabled="currentPage <= 1"
            aria-label="Предыдущая страница"
            @click="goToPage(currentPage - 1)"
          >
            Назад
          </button>
          <div class="page-list" role="list">
            <button
              v-for="n in pageNumbers"
              :key="n"
              type="button"
              class="page-num"
              :class="{ current: n === meta.current_page }"
              :aria-current="n === meta.current_page ? 'page' : undefined"
              :aria-label="`Страница ${n}`"
              @click="goToPage(n)"
            >
              {{ n }}
            </button>
          </div>
          <button
            type="button"
            class="btn btn-ghost page-nav"
            :disabled="currentPage >= meta.last_page"
            aria-label="Следующая страница"
            @click="goToPage(currentPage + 1)"
          >
            Вперёд
          </button>
        </nav>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-catalog {
  max-width: 1100px;
}

.catalog-header {
  margin-bottom: 1.25rem;
}

.bounds-hint {
  margin: -0.5rem 0 0;
  font-size: 0.9375rem;
}

.catalog-layout {
  display: grid;
  grid-template-columns: minmax(240px, 280px) 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 800px) {
  .catalog-layout {
    grid-template-columns: 1fr;
  }
}

.filters-title {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.filter-form {
  margin-bottom: 1.25rem;
}

.filter-form .field {
  margin-bottom: 0.85rem;
}

.filter-help {
  margin: 0 0 1rem;
  font-size: 0.8rem;
  line-height: 1.4;
}

.filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-field {
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.label-block {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.35rem;
  color: var(--text, #18181b);
}

.select-input {
  cursor: pointer;
}

.per-page {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.per-page-btn {
  min-width: 2.5rem;
  padding: 0.45rem 0.6rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--border, #e4e4e7);
  border-radius: 8px;
  background: #fff;
  color: var(--text, #18181b);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.per-page-btn:hover {
  background: var(--bg, #f4f4f5);
}

.per-page-btn.active {
  background: rgb(79 70 229 / 0.12);
  border-color: var(--accent, #4f46e5);
  color: var(--accent, #4f46e5);
}

.catalog-main {
  min-width: 0;
}

.result-line {
  margin: 0 0 1rem;
  font-size: 0.9375rem;
  color: var(--muted, #71717a);
}

.catalog-err {
  margin-bottom: 1rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.empty-state {
  list-style: none;
  margin: 0;
  padding: 2rem 1.5rem;
  text-align: center;
}

.empty-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1.05rem;
  color: var(--text, #18181b);
}

.product-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.1rem;
}

.product-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.product-card:focus-within {
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
  outline: 2px solid rgb(79 70 229 / 0.4);
  outline-offset: 2px;
}

.product-media {
  aspect-ratio: 4 / 3;
  background: var(--bg, #f4f4f5);
}

.product-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-img--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e4e4e7, #f4f4f5);
}

.placeholder-text {
  font-size: 0.85rem;
  color: var(--muted, #71717a);
  font-weight: 500;
}

.product-body {
  padding: 1rem 1.1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.product-name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text, #18181b);
}

.product-desc {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.4;
  flex: 1;
}

.product-price {
  margin: 0.25rem 0 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--accent, #4f46e5);
}

.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem 0.75rem;
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border, #e4e4e7);
}

.page-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
}

.page-num {
  min-width: 2.4rem;
  min-height: 2.4rem;
  padding: 0.35rem 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid var(--border, #e4e4e7);
  border-radius: 8px;
  background: #fff;
  color: var(--text, #18181b);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s;
}

.page-num:hover {
  background: var(--bg, #f4f4f5);
}

.page-num.current {
  background: var(--accent, #4f46e5);
  border-color: var(--accent, #4f46e5);
  color: #fff;
}

.page-nav:disabled {
  opacity: 0.45;
}
</style>
