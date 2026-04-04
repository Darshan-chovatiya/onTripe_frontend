import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'

function AgencyTopBar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white/90 px-4 backdrop-blur-sm sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </button>
    </header>
  )
}

/**
 * Shell for parent / child / sub agency UIs. Pass role-specific sidebar.
 * @param {{ sidebar: import('react').ComponentType<{ isOpen: boolean, onClose: () => void }> }} props
 */
export default function AgencyLayout({ sidebar: Sidebar }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AgencyTopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
