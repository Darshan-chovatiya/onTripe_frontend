/** @typedef {'admin' | 'parentAgency' | 'childAgency' | 'subChild' | 'customer' | 'vendor'} AppRole */

export const AUTH_STORAGE_KEY = 'ontrip-auth'

export const ROLES = {
  ADMIN: 'admin',
  PARENT_AGENCY: 'parentAgency',
  CHILD_AGENCY: 'childAgency',
  SUB_CHILD: 'subChild',
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
}

export const ALL_ROLES = Object.values(ROLES)
