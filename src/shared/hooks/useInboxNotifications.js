import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { ROLES } from '@/shared/utils/constants.js'
import { getInboxNotificationLink } from '@/shared/utils/notificationLinks.js'
import { AUTH_SCOPES } from '@/shared/utils/authStorage.js'

const SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') ||
  'http://localhost:5001'

/**
 * @param {object} options
 * @param {'customer'|'vendor'} options.scope
 * @param {() => Promise<{ data: object }>} options.fetchUnreadCount
 * @param {(notification: object) => boolean} [options.onNotificationOpen] If true, skip route navigation
 */
export function useInboxNotifications({ scope, fetchUnreadCount, onNotificationOpen }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const refreshRef = useRef(null)

  const recipientType = scope === 'customer' ? 'Customer' : 'Vendor'
  const role = scope === 'customer' ? ROLES.CUSTOMER : ROLES.VENDOR

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetchUnreadCount()
      if (res.data?.success) {
        setUnreadCount(res.data.data.unreadCount ?? 0)
      }
    } catch {
      /* ignore */
    }
  }, [fetchUnreadCount])

  refreshRef.current = refreshUnread

  useEffect(() => {
    refreshUnread()
    const interval = setInterval(refreshUnread, 45000)
    return () => clearInterval(interval)
  }, [refreshUnread])

  useEffect(() => {
    if (!user?.id) return undefined

    const socket = io(SOCKET_URL, { transports: ['websocket'] })

    socket.on('inbox_notification', (payload) => {
      if (payload?.recipientType !== recipientType) return
      if (String(payload?.recipientId) !== String(user.id)) return

      refreshRef.current?.()

      const n = payload.notification
      if (!n) return

      const href = getInboxNotificationLink(n, role)
      const onNotificationsPage =
        scope === 'customer'
          ? location.pathname.startsWith('/customer/notifications')
          : location.pathname.startsWith('/vendor/notifications')

      if (!onNotificationsPage) {
        if (onNotificationOpen) {
          toast.info(n.body || n.title, n.title, () => onNotificationOpen(n))
        } else {
          toast.info(n.body || n.title, n.title, href)
        }
      }
    })

    return () => socket.disconnect()
  }, [user?.id, recipientType, role, scope, toast, location.pathname, onNotificationOpen])

  const markReadAndNavigate = useCallback(
    async (notification, markReadFn) => {
      if (!notification?._id) return
      try {
        if (!notification.isRead && markReadFn) {
          await markReadFn(notification._id)
          setUnreadCount((c) => Math.max(0, c - 1))
        }
      } catch {
        /* continue */
      }
      if (onNotificationOpen?.(notification)) return
      const href = getInboxNotificationLink(notification, role)
      if (href) navigate(href)
    },
    [navigate, role, onNotificationOpen]
  )

  return {
    unreadCount,
    refreshUnread,
    markReadAndNavigate,
    authScope: scope === 'customer' ? AUTH_SCOPES.CUSTOMER : AUTH_SCOPES.VENDOR,
  }
}
