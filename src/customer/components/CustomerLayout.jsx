import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import CustomerSidebar from '@/customer/components/CustomerSidebar.jsx'
import CustomerHeader from '@/customer/components/CustomerHeader.jsx'

export default function CustomerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <CustomerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <CustomerHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden dark:bg-black/60"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
    </div>
  )
}
