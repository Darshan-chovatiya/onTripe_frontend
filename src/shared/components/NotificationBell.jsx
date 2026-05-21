import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'

/**
 * @param {{ to: string, unreadCount?: number, solidHeader?: boolean }} props
 */
export default function NotificationBell({ to, unreadCount = 0, solidHeader = true }) {
  const showBadge = unreadCount > 0

  return (
    <Link
      to={to}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
        solidHeader
          ? 'text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-primary-600'
          : 'text-white/70 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white'
      }`}
      aria-label={`Notifications${showBadge ? `, ${unreadCount} unread` : ''}`}
    >
      <Bell size={20} strokeWidth={2} />
      {showBadge && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
