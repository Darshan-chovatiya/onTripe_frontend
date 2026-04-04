import { LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const Dashboard = () => {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Welcome to the parents panel</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Hello{user?.name ? `, ${user.name}` : ''}
            </h2>
            <p className="text-gray-600 text-sm mt-1 max-w-xl">
              This is a minimal parents panel shell. Extend it with your features as needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
