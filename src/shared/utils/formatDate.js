/**
 * @param {string | number | Date} value
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatDate(value, options = { dateStyle: 'medium' }) {
  if (value == null || value === '') return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, options).format(d)
}
