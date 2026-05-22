import { useEffect, useState, useCallback } from 'react'
import { Bell, BellOff, CheckCheck, MessageSquare, Megaphone, Users, Building2, Loader2, Clock } from 'lucide-react'
import Loader from '@/shared/components/Loader.jsx'
import { getNotificationTypeLabel } from '@/shared/utils/notificationLinks.js'

function typeIcon(type) {
  switch (type) {
    case 'community_message':
      return Users
    case 'vendor_dm':
      return MessageSquare
    case 'agency_dm':
      return Building2
    case 'broadcast':
      return Megaphone
    case 'event_reminder':
      return Clock
    default:
      return Bell
  }
}

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {() => Promise<{ data: object }>} props.fetchList
 * @param {(id: string) => Promise<{ data: object }>} props.markRead
 * @param {() => Promise<{ data: object }>} props.markAllRead
 * @param {(notification: object) => void} props.onNotificationClick
 */
export default function NotificationsInbox({
  title,
  subtitle,
  fetchList,
  markRead,
  markAllRead,
  onNotificationClick,
}) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchList()
      if (res.data?.success) {
        setNotifications(res.data.data.notifications || [])
        setUnreadCount(res.data.data.unreadCount ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [fetchList])

  useEffect(() => {
    load()
  }, [load])

  const handleMarkAll = async () => {
    setMarkingAll(true)
    try {
      const res = await markAllRead()
      if (res.data?.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } finally {
      setMarkingAll(false)
    }
  }

  const handleClick = async (n) => {
    const updated = { ...n, isRead: true }
    if (!n.isRead) {
      try {
        await markRead(n._id)
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        /* still navigate */
      }
    }
    onNotificationClick(updated)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader size="lg" text="Loading notifications…" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-3 pb-24 pt-4 sm:px-4 sm:pb-32 sm:pt-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">{subtitle}</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markingAll}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
          >
            {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <BellOff size={28} />
          </div>
          <div>
            <p className="font-bold text-gray-900">No notifications yet</p>
            <p className="mt-1 text-sm text-gray-500">Messages and updates will appear here.</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcon(n.type)
            return (
              <li key={n._id}>
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`w-full rounded-2xl border p-3 text-left transition-all hover:shadow-md sm:p-4 ${
                    n.isRead
                      ? 'border-gray-100 bg-white hover:border-gray-200'
                      : 'border-primary-200 bg-primary-50/50 hover:border-primary-300 shadow-sm'
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        n.isRead ? 'bg-gray-100 text-gray-500' : 'bg-primary-600 text-white'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-bold ${n.isRead ? 'text-gray-800' : 'text-gray-900'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-600" />
                        )}
                      </div>
                      {n.body && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{n.body}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        <span>{getNotificationTypeLabel(n.type)}</span>
                        <span>·</span>
                        <span>{n.senderName || 'OnTrip'}</span>
                        <span>·</span>
                        <span>
                          {new Date(n.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
