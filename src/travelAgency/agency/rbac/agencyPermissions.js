import { ROLES } from '@/shared/utils/constants.js'

/**
 * Fine-grained permissions for the unified Agency Panel.
 * Route guards and UI use these keys — not role names — so new roles or rules stay centralized.
 */
export const P = {
  /** View dashboard */
  DASHBOARD: 'agency:dashboard',
  /** Parent: create/edit packages; view detail */
  PACKAGES_FULL: 'agency:packages:full',
  /** Child & sub-child: clone / white-label / custom pricing (shared Packages UI) */
  PACKAGES_CLONE: 'agency:packages:clone',
  /** Parent: vendor network */
  VENDORS: 'agency:vendors',
  /** Parent: all bookings under network */
  BOOKINGS_NETWORK: 'agency:bookings:network',
  /** Child: sales / operational bookings */
  BOOKINGS_SALES: 'agency:bookings:sales',
  /** Child: manage sub-agents */
  NETWORK_CHILDREN: 'agency:network:children',
  /** Child & sub-child: traveler / lead customer directory (agency CRM) */
  CUSTOMERS: 'agency:customers',
  SETTINGS: 'agency:settings',
}

/** Parent: full ops — no sub-child-only screens (my bookings, profile). */
const PARENT_PERMISSIONS = [
  P.DASHBOARD,
  P.PACKAGES_FULL,
  P.VENDORS,
  P.BOOKINGS_NETWORK,
  P.NETWORK_CHILDREN,
  P.SETTINGS,
]

/** @type {Record<string, readonly string[]>} */
const ROLE_TO_PERMISSIONS = {
  [ROLES.PARENT_AGENCY]: PARENT_PERMISSIONS,
  [ROLES.CHILD_AGENCY]: [
    P.DASHBOARD,
    P.PACKAGES_CLONE,
    P.BOOKINGS_SALES,
    P.NETWORK_CHILDREN,
    P.CUSTOMERS,
    P.SETTINGS,
  ],
}

/**
 * @param {string | undefined} role
 * @returns {ReadonlySet<string>}
 */
export function getPermissionsForRole(role) {
  if (!role) return new Set()
  const list = ROLE_TO_PERMISSIONS[role]
  if (!list) return new Set()
  return new Set(list)
}

/**
 * @param {string | undefined} role
 * @param {string} permission
 */
export function roleHasPermission(role, permission) {
  return getPermissionsForRole(role).has(permission)
}

/** Human-readable labels for header / sidebar */
export const AGENCY_ROLE_LABELS = {
  [ROLES.PARENT_AGENCY]: 'Parent agency',
  [ROLES.CHILD_AGENCY]: 'Agent panel',
}
