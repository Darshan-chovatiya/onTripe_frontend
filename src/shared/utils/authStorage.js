import {
  AUTH_STORAGE_KEY,
  AUTH_STORAGE_KEY_CUSTOMER,
  AUTH_STORAGE_KEY_VENDOR,
  ROLES,
} from '@/shared/utils/constants.js'

/** @typedef {'customer' | 'vendor' | 'app'} AuthScope */

export const AUTH_SCOPES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  APP: 'app',
}

/** @param {AuthScope} scope */
export function getStorageKeyForScope(scope) {
  switch (scope) {
    case AUTH_SCOPES.CUSTOMER:
      return AUTH_STORAGE_KEY_CUSTOMER
    case AUTH_SCOPES.VENDOR:
      return AUTH_STORAGE_KEY_VENDOR
    default:
      return AUTH_STORAGE_KEY
  }
}

/**
 * @param {string} pathname
 * @returns {AuthScope}
 */
export function getScopeFromPathname(pathname) {
  if (pathname.startsWith('/customer')) return AUTH_SCOPES.CUSTOMER
  if (pathname.startsWith('/vendor')) return AUTH_SCOPES.VENDOR
  return AUTH_SCOPES.APP
}

/**
 * @param {string | undefined} role
 * @returns {AuthScope}
 */
export function getScopeForRole(role) {
  if (role === ROLES.CUSTOMER) return AUTH_SCOPES.CUSTOMER
  if (role === ROLES.VENDOR) return AUTH_SCOPES.VENDOR
  return AUTH_SCOPES.APP
}

/** Current hash route path (e.g. `/customer/community`). */
export function getHashPathname() {
  if (typeof window === 'undefined') return '/'
  const hash = window.location.hash || ''
  return (hash.replace(/^#/, '') || '/').split('?')[0]
}

/**
 * Auth scope for shared routes (community, auth/me) from the active panel in the URL.
 * @returns {AuthScope}
 */
export function getScopeFromBrowserPath() {
  const pathname = getHashPathname()
  if (pathname.startsWith('/customer')) return AUTH_SCOPES.CUSTOMER
  if (pathname.startsWith('/vendor')) return AUTH_SCOPES.VENDOR
  return AUTH_SCOPES.APP
}

/**
 * Pick which stored token to attach based on API path.
 * @param {string} url — axios config.url (relative to /api)
 * @returns {AuthScope}
 */
export function getScopeForApiUrl(url) {
  const u = url || ''
  if (
    u.startsWith('/customer') ||
    u.includes('/auth/otp/customer') ||
    u.includes('/auth/login/customer')
  ) {
    return AUTH_SCOPES.CUSTOMER
  }
  if (
    u.startsWith('/vendor') ||
    u.includes('/auth/otp/vendor') ||
    u.includes('/auth/login/vendor')
  ) {
    return AUTH_SCOPES.VENDOR
  }
  if (u.startsWith('/community')) {
    return getScopeFromBrowserPath()
  }
  return AUTH_SCOPES.APP
}

/**
 * @param {AuthScope} scope
 * @returns {{ token: string, user: object } | null}
 */
export function loadStoredSession(scope) {
  const key = getStorageKeyForScope(scope)
  let raw = localStorage.getItem(key)

  if (!raw && scope === AUTH_SCOPES.APP) {
    raw = localStorage.getItem(AUTH_STORAGE_KEY)
  }

  if (!raw) {
    const legacy = loadLegacySessionForScope(scope)
    if (legacy) return legacy
    return null
  }

  try {
    const parsed = JSON.parse(raw)
    if (parsed?.token && parsed?.user) {
      return { token: parsed.token, user: parsed.user }
    }
  } catch {
    /* ignore */
  }
  return null
}

/** Migrate single-key `ontrip-auth` into the correct scope key once. */
function loadLegacySessionForScope(scope) {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.token || !parsed?.user) return null
    const role = String(parsed.user.role || '').toLowerCase()
    const legacyScope =
      role === 'customer'
        ? AUTH_SCOPES.CUSTOMER
        : role === 'vendor'
          ? AUTH_SCOPES.VENDOR
          : AUTH_SCOPES.APP
    if (legacyScope !== scope) return null
    persistStoredSession(scope, parsed.token, parsed.user)
    return { token: parsed.token, user: parsed.user }
  } catch {
    return null
  }
}

/**
 * @param {AuthScope} scope
 * @param {string} token
 * @param {object} user
 */
export function persistStoredSession(scope, token, user) {
  const key = getStorageKeyForScope(scope)
  localStorage.setItem(key, JSON.stringify({ token, user }))
}

/**
 * @param {AuthScope} scope
 */
export function clearStoredSession(scope) {
  localStorage.removeItem(getStorageKeyForScope(scope))
}

/**
 * @param {AuthScope} scope
 * @returns {string | null}
 */
export function readStoredToken(scope) {
  return loadStoredSession(scope)?.token ?? null
}
