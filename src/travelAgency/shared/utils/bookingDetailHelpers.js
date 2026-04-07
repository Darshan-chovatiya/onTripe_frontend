const BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).replace('/api', '').replace(/\/$/, '')
    : 'http://localhost:5001'

/** @param {string | null | undefined} path */
export function filePublicUrl(path) {
  if (!path || typeof path !== 'string') return null
  const p = path.replace(/\\/g, '/')
  return `${BASE}/${p.replace(/^\//, '')}`
}

export function formatDateTime(v) {
  if (!v) return '—'
  try {
    return new Date(v).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

export function formatDateOnly(v) {
  if (!v) return '—'
  try {
    return new Date(v).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

/** @param {Record<string, unknown>} b */
export function bookingOfferTitle(b) {
  if (!b || typeof b !== 'object') return '—'
  if (b.whitelabelPackage && typeof b.whitelabelPackage === 'object') {
    const wl = /** @type {Record<string, unknown>} */ (b.whitelabelPackage)
    const orig = wl.originalPackage
    const origTitle = typeof orig === 'object' && orig && 'title' in orig ? String(orig.title) : ''
    return String(wl.customTitle || origTitle || 'White-label offer')
  }
  const pkg = b.package
  if (pkg && typeof pkg === 'object' && 'title' in pkg) return String(pkg.title)
  return '—'
}

/** @param {Record<string, unknown>} b */
export function basePackageFromBooking(b) {
  if (!b || typeof b !== 'object') return null
  if (b.whitelabelPackage && typeof b.whitelabelPackage === 'object') {
    const wl = /** @type {Record<string, unknown>} */ (b.whitelabelPackage)
    const orig = wl.originalPackage
    if (orig && typeof orig === 'object') return /** @type {Record<string, unknown>} */ (orig)
  }
  const pkg = b.package
  if (pkg && typeof pkg === 'object') return /** @type {Record<string, unknown>} */ (pkg)
  return null
}

/** Collect doc paths from a `docs` object (customer or traveler). */
/** @param {Record<string, unknown> | null | undefined} docs */
export function flattenDocPaths(docs) {
  if (!docs || typeof docs !== 'object') return []
  const out = []
  for (const [k, val] of Object.entries(docs)) {
    if (k === 'otherDocs' && Array.isArray(val)) {
      val.forEach((p, i) => {
        if (typeof p === 'string' && p) out.push({ key: `${k}_${i}`, label: 'Other document', path: p })
      })
    } else if (typeof val === 'string' && val) {
      out.push({ key: k, label: humanizeDocKey(k), path: val })
    }
  }
  return out
}

function humanizeDocKey(k) {
  return String(k)
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}
