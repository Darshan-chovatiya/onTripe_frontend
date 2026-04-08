import { ROLES } from '@/shared/utils/constants.js'

const AGENCY_ROLES = [ROLES.PARENT_AGENCY, ROLES.CHILD_AGENCY, ROLES.SUB_CHILD]

/**
 * Canonical route metadata (paths must match AppRouter).
 * Role enforcement is implemented via `getRequiredRolesForPath` in `@/shared/utils/roleHelpers.js`.
 * @type {{ path: string, allowedRoles: string[] }[]}
 */
export const routeConfig = [
  { path: '/admin/dashboard', allowedRoles: [ROLES.ADMIN] },
  { path: '/admin/users', allowedRoles: [ROLES.ADMIN] },
  { path: '/admin/agencies', allowedRoles: [ROLES.ADMIN] },
  { path: '/admin/child-agencies', allowedRoles: [ROLES.ADMIN] },
  { path: '/admin/reports', allowedRoles: [ROLES.ADMIN] },
  { path: '/admin/settings', allowedRoles: [ROLES.ADMIN] },

  { path: '/agency/dashboard', allowedRoles: AGENCY_ROLES },
  { path: '/agency/packages', allowedRoles: AGENCY_ROLES },
  { path: '/agency/vendors', allowedRoles: [ROLES.PARENT_AGENCY] },
  { path: '/agency/bookings', allowedRoles: [ROLES.PARENT_AGENCY, ROLES.CHILD_AGENCY] },
  { path: '/agency/my-bookings', allowedRoles: [ROLES.SUB_CHILD] },
  { path: '/agency/manage-downstream', allowedRoles: [ROLES.PARENT_AGENCY, ROLES.CHILD_AGENCY] },
  { path: '/agency/customers', allowedRoles: [ROLES.CHILD_AGENCY, ROLES.SUB_CHILD] },
  { path: '/agency/settings', allowedRoles: AGENCY_ROLES },

  { path: '/customer/home', allowedRoles: [ROLES.CUSTOMER] },
  { path: '/customer/search', allowedRoles: [ROLES.CUSTOMER] },
  { path: '/customer/booking', allowedRoles: [ROLES.CUSTOMER] },
  { path: '/customer/trip-history', allowedRoles: [ROLES.CUSTOMER] },
  { path: '/customer/profile', allowedRoles: [ROLES.CUSTOMER] },
]

export const publicPaths = [
  '/login',
  '/customer/login',
  '/forgot-password',
  '/unauthorized',
]
