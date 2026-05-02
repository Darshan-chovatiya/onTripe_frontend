/** @typedef {'admin' | 'parentAgency' | 'childAgency' | 'subChild' | 'customer' | 'vendor'} AppRole */

export const AUTH_STORAGE_KEY = 'ontrip-auth'

export const ROLES = {
  ADMIN: 'admin',
  PARENT_AGENCY: 'parent_agent',
  CHILD_AGENCY: 'child_agent',
  SUB_CHILD: 'sub_child_agent',
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
}

export const ALL_ROLES = Object.values(ROLES)
