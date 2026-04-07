import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import AgencyUserMenu from '@/travelAgency/shared/components/AgencyUserMenu.jsx'

function AgencyTopBar({ onMenuClick, title, subtitle }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur-sm sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="shrink-0 rounded-lg p-2 hover:bg-gray-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg">{title}</h1>
        {subtitle ? <p className="truncate text-xs text-gray-500">{subtitle}</p> : null}
      </div>

      <div className="shrink-0">
        <AgencyUserMenu />
      </div>
    </header>
  )
}

/**
 * Shell for parent / child / sub agency UIs. Pass role-specific sidebar.
 * @param {{ sidebar: import('react').ComponentType<{ isOpen: boolean, onClose: () => void }>, headerTitle: string, headerSubtitle?: string }} props
 */
export default function AgencyLayout({ sidebar: Sidebar, headerTitle, headerSubtitle = 'Travel' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AgencyTopBar
          onMenuClick={() => setSidebarOpen(true)}
          title={headerTitle}
          subtitle={headerSubtitle}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
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
