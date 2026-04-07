import { ROLES } from './constants.js'

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
      return '/customer/home'
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
  return null
}

/**
 * Get the specific login page path based on the current URI.
 * Used for logout redirection and unauthorized access.
 * @param {string} pathname
 */
export function getLoginPathForCurrentPath(pathname) {
  if (pathname.startsWith('/admin')) return '/admin/login'
  if (pathname.startsWith('/agency/parent')) return '/travelAgency/parent/login'
  if (pathname.startsWith('/agency/child')) return '/travelAgency/child/login'
  if (pathname.startsWith('/agency/sub')) return '/travelAgency/subchild/login'
  if (pathname.startsWith('/agency')) return '/travelAgency/parent/login'
  return '/login'
}

