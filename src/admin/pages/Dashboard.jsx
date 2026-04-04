import { LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome to the admin panel</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100">
            <LayoutDashboard className="h-7 w-7 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Hello{user?.name ? `, ${user.name}` : ''}</h2>
            <p className="mt-1 max-w-xl text-sm text-gray-600">
              Migrated from the legacy admin app. Add widgets and stats here as needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
