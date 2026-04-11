/** Resolve uploaded package image paths from API (same pattern as parent PackageCard). */
import { getApiOrigin } from '@/shared/config/api.js'

export function getAssetBaseUrl() {
  return getApiOrigin()
}

export function packageCoverUrl(coverImage) {
  if (!coverImage) return null
  const base = getAssetBaseUrl()
  return `${base}/${String(coverImage).replace(/\\/g, '/')}`
}
