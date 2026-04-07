/**
 * Normalize package destination from API (string or rare populated shape).
 */
export function destinationText(raw) {
  if (raw == null) return ''
  if (typeof raw === 'string') return raw.trim()
  if (typeof raw === 'object' && raw !== null && 'name' in raw && typeof raw.name === 'string') {
    return raw.name.trim()
  }
  return String(raw).trim()
}
