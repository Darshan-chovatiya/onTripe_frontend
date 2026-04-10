import { ROLES } from './constants.js'

/**
 * After password login / session restore: parent agencies with pending or rejected KYC go to Settings.
 * @param {{ role?: string, kyc?: { status?: string } } | null | undefined} user
 */
export function getPostLoginRedirectPath(user) {
  if (!user?.role) return '/login'
  if (user.role === ROLES.PARENT_AGENCY) {
    const st = user.kyc?.status
    if (st === 'pending' || st === 'rejected') return '/agency/settings'
  }
  return getRoleRedirectPath(user.role)
}

/**
 * Default route inside unified `/agency` (e.g. `/agency` with no path).
 * @param {{ role?: string, kyc?: { status?: string } } | null | undefined} user
 */
export function getAgencyPanelDefaultPath(user) {
  if (user?.role === ROLES.PARENT_AGENCY) {
    const st = user.kyc?.status
    if (st === 'pending' || st === 'rejected') return '/agency/settings'
  }
  return '/agency/dashboard'
}

/** @param {string | undefined} role */
export function getRoleRedirectPath(role) {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin/dashboard'
    case ROLES.PARENT_AGENCY:
      return '/agency/parent/dashboard'
    case ROLES.CHILD_AGENCY:
      return '/agency/child/dashboard'
    case ROLES.SUB_CHILD:
      return '/agency/sub/dashboard'
    case ROLES.CUSTOMER:
      return '/customer/booking'
    case ROLES.VENDOR:
      return '/vendor/dashboard'
    default:
      return '/login'
  }
}

/**
 * Coarse permission checks — extend PERMISSIONS as your API evolves.
 * @param {string | undefined} role
 * @param {string} action
 */
export function hasPermission(role, action) {
  if (!role) return false

  const PERMISSIONS = {
    'admin:users:read': [ROLES.ADMIN],
    'admin:users:write': [ROLES.ADMIN],
    'agency:packages:read': [ROLES.PARENT_AGENCY, ROLES.CHILD_AGENCY, ROLES.SUB_CHILD],
    'agency:packages:write': [ROLES.PARENT_AGENCY, ROLES.CHILD_AGENCY],
    'customer:book': [ROLES.CUSTOMER],
  }

  const allowed = PERMISSIONS[action]
  if (!allowed) return false
  return allowed.includes(role)
}

/**
 * Map pathname prefix to roles allowed for that section.
 * Used by route guard; keep in sync with React Router paths in AppRouter.
 * @param {string} pathname
 * @returns {string[] | null} null = no role restriction (public or unknown)
 */
export function getRequiredRolesForPath(pathname) {
  if (pathname.startsWith('/admin')) return [ROLES.ADMIN]
  if (pathname.startsWith('/agency/parent')) return [ROLES.PARENT_AGENCY]
  if (pathname.startsWith('/agency/child')) return [ROLES.CHILD_AGENCY]
  if (pathname.startsWith('/agency/sub')) return [ROLES.SUB_CHILD]
  if (pathname.startsWith('/agency')) {
    return [ROLES.PARENT_AGENCY, ROLES.CHILD_AGENCY, ROLES.SUB_CHILD]
  }
  if (pathname.startsWith('/customer')) return [ROLES.CUSTOMER]
  if (pathname.startsWith('/vendor')) return [ROLES.VENDOR]
  return null
}

/**
 * Get the specific login page path based on the current URI.
 * Used for logout redirection and unauthorized access.
 * @param {string} pathname
 */
export function getLoginPathForCurrentPath(pathname) {
  if (pathname.startsWith('/admin')) return '/login'
  if (pathname.startsWith('/agency/parent')) return '/login'
  if (pathname.startsWith('/agency/child')) return '/login'
  if (pathname.startsWith('/agency/sub')) return '/login'
  if (pathname.startsWith('/agency')) return '/login'
  if (pathname.startsWith('/customer')) return '/customer/login'
  if (pathname.startsWith('/vendor')) return '/vendor/login'
  return '/login'
}

