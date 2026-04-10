import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '@/admin/components/Sidebar.jsx'
import Header from '@/admin/components/Header.jsx'

const isAdminPackageCommunityPath = (pathname) =>
  /^\/admin\/packages\/[^/]+\/community\/?$/.test(pathname)

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
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
              : 'flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8'
          }
        >
          <div
            className={
              fullBleedCommunity
                ? 'flex min-h-0 min-w-0 flex-1 flex-col'
                : 'mx-auto max-w-7xl'
            }
          >
            <Outlet />
          </div>
        </main>
      </div>
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
    </div>
  )
}
