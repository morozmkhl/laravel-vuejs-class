/**
 * Форматирование для отображения в UI (без логики домена).
 */

export function formatPriceRub(value) {
  const n = Number(value)
  if (Number.isNaN(n)) {
    return '—'
  }
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(n)
}

export function clipText(text, max = 80) {
  if (!text) {
    return '—'
  }
  return text.length > max ? `${text.slice(0, max)}…` : text
}
