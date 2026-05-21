import { ROLES } from '@/shared/utils/constants.js'

/**
 * @param {{ type?: string, data?: Record<string, string> }} notification
 * @param {string} role
 * @returns {string|null}
 */
export function getInboxNotificationLink(notification, role) {
  const d = notification?.data || {}
  const type = notification?.type

  if (type === 'community_message' && d.packageId) {
    if (role === ROLES.CUSTOMER) return `/customer/community?pkg=${d.packageId}`
    if (role === ROLES.VENDOR) return `/vendor/community?pkg=${d.packageId}`
  }

  if (type === 'vendor_dm') {
    if (role === ROLES.CUSTOMER && d.bookingId && d.vendorId) {
      return `/customer/booking/${d.bookingId}?chatVendor=${d.vendorId}`
    }
    if (role === ROLES.VENDOR) {
      return null
    }
  }

  if (type === 'agency_dm' && role === ROLES.VENDOR) {
    return null
  }

  if (type === 'broadcast') {
    if (role === ROLES.CUSTOMER) return '/customer/notifications'
    if (role === ROLES.VENDOR) return '/vendor/notifications'
  }

  return role === ROLES.CUSTOMER ? '/customer/notifications' : '/vendor/notifications'
}

export function getNotificationTypeLabel(type) {
  switch (type) {
    case 'community_message':
      return 'Community'
    case 'vendor_dm':
      return 'Direct message'
    case 'agency_dm':
      return 'Agency'
    case 'broadcast':
      return 'Announcement'
    default:
      return 'Notification'
  }
}
