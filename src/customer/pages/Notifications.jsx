import NotificationsInbox from '@/shared/components/NotificationsInbox.jsx'
import {
  getCustomerNotifications,
  getCustomerUnreadCount,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
} from '@/customer/services/customerApi.js'
import { useInboxNotifications } from '@/shared/hooks/useInboxNotifications.js'

export default function CustomerNotifications() {
  const { markReadAndNavigate } = useInboxNotifications({
    scope: 'customer',
    fetchUnreadCount: getCustomerUnreadCount,
  })

  return (
    <NotificationsInbox
      title="Notifications"
      subtitle="All messages, community updates, and announcements."
      fetchList={getCustomerNotifications}
      markRead={markCustomerNotificationRead}
      markAllRead={markAllCustomerNotificationsRead}
      onNotificationClick={(n) => markReadAndNavigate(n, markCustomerNotificationRead)}
    />
  )
}
