import { useNavigate, useParams } from 'react-router-dom'
import CommunityChat from '@/customer/components/CommunityChat.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function AdminPackageCommunity() {
  const { packageId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <CommunityChat
        packageId={packageId}
        currentUserId={user?.id}
        layout="page"
        flush
        onBack={() => navigate(-1)}
      />
    </div>
  )
}
