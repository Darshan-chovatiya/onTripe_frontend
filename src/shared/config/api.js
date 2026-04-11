/**
 * Backend URL from Vite env. Use this module everywhere instead of hardcoding hosts.
 *
 * In `onTripe frontend/.env` set exactly (restart `npm run dev` after edits):
 *   VITE_API_BASE_URL=https://your-domain.com/api
 * or the same host without `/api` (it will be appended):
 *   VITE_API_BASE_URL=https://your-domain.com
 *
 * Only variables prefixed with `VITE_` are exposed to the client.
 */

const DEFAULT_DEV_API = 'http://localhost:5001/api'

/**
 * @param {string | undefined} raw
 * @returns {string | null}
 */
export function normalizeApiBaseUrl(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return null
  let base = s.replace(/\/+$/, '')
  if (!/\/api$/i.test(base)) {
    base = base.endsWith('/') ? `${base}api` : `${base}/api`
  }
  return base.replace(/([^:]\/)\/+/g, '$1')
}

/**
 * REST API base (axios `baseURL`). Ends with `/api`, no trailing slash after it.
 */
export function getApiBaseUrl() {
  const fromEnv = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
  if (fromEnv) return fromEnv
  if (import.meta.env.DEV) return DEFAULT_DEV_API
  console.warn(
    '[OnTrip] VITE_API_BASE_URL is not set. Add it to `.env` in the frontend folder and rebuild for production.'
  )
  return DEFAULT_DEV_API
}

/**
 * Server origin for static files (`/uploads/...`) and Socket.IO (no `/api`).
 */
export function getApiOrigin() {
  return getApiBaseUrl()
    .replace(/\/api\/?$/i, '')
    .replace(/\/+$/, '')
}

/**
 * Absolute URL for a path returned by the API (e.g. `uploads/...`).
 * @param {string | null | undefined} path
 */
export function joinUploadUrl(path) {
  if (path == null || path === '') return ''
  const p = String(path).replace(/\\/g, '/').replace(/^\//, '')
  return `${getApiOrigin()}/${p}`
}
