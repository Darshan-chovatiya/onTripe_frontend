import { useAuth } from '@/shared/context/AuthContext.jsx'

/** Placeholder — migrate full `customer/src/pages/Settings.jsx` profile form here when ready */
export default function Profile() {
  const { user } = useAuth()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
      <div className="card dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Signed in as <span className="font-medium text-gray-900 dark:text-white">{user?.name || user?.mobile}</span>
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Wire profile update APIs through <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">customer/services/customerApi.js</code>.
        </p>
      </div>
    </div>
  )
}
