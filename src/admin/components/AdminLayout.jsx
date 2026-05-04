import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import Sidebar from '@/admin/components/Sidebar.jsx'
import Header from '@/admin/components/Header.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'

const isAdminPackageCommunityPath = (pathname) =>
  /^\/admin\/packages\/[^/]+\/community\/?$/.test(pathname)

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('new_message_notify', (msg) => {
      if (isAdminPackageCommunityPath(pathnameRef.current)) return
      const sender  = msg?.sender?.name || 'Someone'
      const text    = msg?.type === 'image' ? '📷 Photo' : (msg?.content || '')
      const preview = text.length > 60 ? text.slice(0, 57) + '…' : text
      const href    = msg?.packageId ? `/admin/packages/${msg.packageId}/community` : null
      toastRef.current.info(
        preview ? `${sender}: ${preview}` : `New message from ${sender}`,
        'New message',
        href
      )
    })

    return () => { socket.disconnect() }
  }, [])
  const fullBleedCommunity = isAdminPackageCommunityPath(pathname)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main
          className={
            fullBleedCommunity
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden p-0'
              : 'flex-1 overflow-y-auto'
          }
        >
          <div
            className={
              fullBleedCommunity
                ? 'flex min-h-0 min-w-0 flex-1 flex-col'
                : 'mx-auto max-w-7xl p-4 sm:p-6'
            }
          >
            <Outlet />
          </div>
        </main>
      </div>
      {sidebarOpen ? (
        <button type="button" className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          aria-label="Close menu" onClick={() => setSidebarOpen(false)} />
      ) : null}
    </div>
  )
}
