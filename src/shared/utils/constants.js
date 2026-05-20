/** @typedef {'admin' | 'parentAgency' | 'childAgency' | 'subChild' | 'customer' | 'vendor'} AppRole */

/** Agency / admin session (legacy key kept for backward compatibility) */
export const AUTH_STORAGE_KEY = 'ontrip-auth'

/** Customer portal session */
export const AUTH_STORAGE_KEY_CUSTOMER = 'ontrip-auth-customer'

/** Vendor portal session */
export const AUTH_STORAGE_KEY_VENDOR = 'ontrip-auth-vendor'

export const ROLES = {
  ADMIN: 'admin',
  PARENT_AGENCY: 'parent_agent',
  CHILD_AGENCY: 'child_agent',
  SUB_CHILD: 'sub_child_agent',
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
}

export const ALL_ROLES = Object.values(ROLES)
