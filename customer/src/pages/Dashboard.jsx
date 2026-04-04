import { LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const Dashboard = () => {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Welcome to the customer panel</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Hello{user?.name ? `, ${user.name}` : ''}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 max-w-xl">
              This is a minimal customer shell. Add discovery, bookings, and account features here as your product grows.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
