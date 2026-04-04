import { LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'

/** Migrated from legacy customer `Dashboard.jsx` */
export default function Home() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Home</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Customer area</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40">
            <LayoutDashboard className="h-7 w-7 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Hello{user?.name ? `, ${user.name}` : ''}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-gray-600 dark:text-gray-300">
              Migrated customer shell. Add discovery and booking flows under `/customer/*`.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
