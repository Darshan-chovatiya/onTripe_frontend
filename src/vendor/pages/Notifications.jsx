import NotificationsInbox from '@/shared/components/NotificationsInbox.jsx'
import {
  getVendorNotifications,
  getVendorUnreadCount,
  markVendorNotificationRead,
  markAllVendorNotificationsRead,
} from '@/vendor/services/vendorApi.js'
import { useInboxNotifications } from '@/shared/hooks/useInboxNotifications.js'
import { useVendorChat } from '@/vendor/context/VendorChatContext.jsx'

export default function VendorNotifications() {
  const { handleVendorNotification } = useVendorChat()
  const { markReadAndNavigate } = useInboxNotifications({
    scope: 'vendor',
    fetchUnreadCount: getVendorUnreadCount,
    onNotificationOpen: handleVendorNotification,
  })

  return (
    <NotificationsInbox
      title="Notifications"
      subtitle="Tap a message to open the chat. Community and agency alerts open here too."
      fetchList={getVendorNotifications}
      markRead={markVendorNotificationRead}
      markAllRead={markAllVendorNotificationsRead}
      onNotificationClick={(n) => markReadAndNavigate(n, markVendorNotificationRead)}
    />
  )
}
