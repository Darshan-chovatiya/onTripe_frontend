/** Resolve uploaded package image paths from API (same pattern as parent PackageCard). */
export function getAssetBaseUrl() {
  const env = import.meta.env.VITE_API_BASE_URL
  if (!env || env.includes('VITE_API_BASE_URL')) return 'http://localhost:5001'
  return env.replace(/\/api\/?$/, '').replace(/\/$/, '')
}

export function packageCoverUrl(coverImage) {
  if (!coverImage) return null
  const base = getAssetBaseUrl()
  return `${base}/${String(coverImage).replace(/\\/g, '/')}`
}
