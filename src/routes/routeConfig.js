import { ROLES } from '@/shared/utils/constants.js'

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

  { path: '/agency/parent/dashboard', allowedRoles: [ROLES.PARENT_AGENCY] },
  { path: '/agency/parent/packages', allowedRoles: [ROLES.PARENT_AGENCY] },
  { path: '/agency/parent/manage-children', allowedRoles: [ROLES.PARENT_AGENCY] },
  { path: '/agency/parent/settings', allowedRoles: [ROLES.PARENT_AGENCY] },

  { path: '/agency/child/dashboard', allowedRoles: [ROLES.CHILD_AGENCY] },
  { path: '/agency/child/bookings', allowedRoles: [ROLES.CHILD_AGENCY] },
  { path: '/agency/child/manage-sub-children', allowedRoles: [ROLES.CHILD_AGENCY] },
  { path: '/agency/child/settings', allowedRoles: [ROLES.CHILD_AGENCY] },

  { path: '/agency/sub/dashboard', allowedRoles: [ROLES.SUB_CHILD] },
  { path: '/agency/sub/my-bookings', allowedRoles: [ROLES.SUB_CHILD] },
  { path: '/agency/sub/profile', allowedRoles: [ROLES.SUB_CHILD] },
  { path: '/agency/sub/settings', allowedRoles: [ROLES.SUB_CHILD] },

  { path: '/customer/home', allowedRoles: [ROLES.CUSTOMER] },
  { path: '/customer/search', allowedRoles: [ROLES.CUSTOMER] },
  { path: '/customer/booking', allowedRoles: [ROLES.CUSTOMER] },
  { path: '/customer/trip-history', allowedRoles: [ROLES.CUSTOMER] },
  { path: '/customer/profile', allowedRoles: [ROLES.CUSTOMER] },
]

export const publicPaths = ['/login', '/forgot-password', '/unauthorized']
