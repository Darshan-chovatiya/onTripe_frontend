import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-600">
        Role: subChild — welcome{user?.name ? `, ${user.name}` : ''}.
      </p>
    </div>
  )
}
