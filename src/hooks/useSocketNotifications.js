import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { ROLES } from '@/shared/utils/constants.js'

const SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') ||
  'http://localhost:5001'

function isOnCommunityPage(pathname, search, packageId) {
  if (/\/admin\/packages\/[^/]+\/community/.test(pathname)) return true
  if (/\/agency\/packages\/[^/]+\/community/.test(pathname)) return true
  if (/\/customer\/booking\/[^/]+\/community/.test(pathname)) return true

  // Customer community page — suppress only if same package is currently open
  if (/\/customer\/community/.test(pathname)) {
    if (!packageId) return true
    const currentPkg = new URLSearchParams(search).get('pkg')
    return currentPkg === packageId
  }
  if (/\/vendor\/community/.test(pathname)) {
    if (!packageId) return true
    const currentPkg = new URLSearchParams(search).get('pkg')
    return currentPkg === packageId
  }
  return false
}

/**
 * Build the chat URL to navigate to when toast is clicked.
 * - admin/agency → /admin/packages/:packageId/community or /agency/packages/:packageId/community
 * - customer     → /customer/community (sidebar will show the right trip)
 */
function getCommunityUrl(role, packageId) {
  if (!packageId) return null
  if (role === ROLES.ADMIN)         return `/admin/packages/${packageId}/community`
  if (role === ROLES.PARENT_AGENCY ||
      role === ROLES.CHILD_AGENCY  ||
      role === ROLES.SUB_CHILD)     return `/agency/packages/${packageId}/community`
  if (role === ROLES.CUSTOMER)      return `/customer/community?pkg=${packageId}`
  if (role === ROLES.VENDOR)        return `/vendor/community?pkg=${packageId}`
  return null
}

export function useSocketNotifications() {
  const { toast } = useToast()
  const { pathname, search } = useLocation()
  const { user } = useAuth()
  const toastRef = useRef(toast)
  const pathnameRef = useRef(pathname)
  const searchRef = useRef(search)
  const userRef = useRef(user)

  toastRef.current = toast
  pathnameRef.current = pathname
  searchRef.current = search
  userRef.current = user

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] })

    socket.on('new_message_notify', (msg) => {
      if (isOnCommunityPage(pathnameRef.current, searchRef.current, msg?.packageId)) return

      const sender  = msg?.sender?.name || 'Someone'
      const text    = msg?.type === 'image' ? '📷 Photo' : (msg?.content || '')
      const preview = text.length > 60 ? text.slice(0, 57) + '…' : text
      const href    = getCommunityUrl(userRef.current?.role, msg?.packageId)

      toastRef.current.info(
        preview ? `${sender}: ${preview}` : `New message from ${sender}`,
        'New message',
        href
      )
    })

    return () => { socket.disconnect() }
  }, [])
}
