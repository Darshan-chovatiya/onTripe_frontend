import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import CommunityChat from '@/customer/components/CommunityChat.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function AgencyPackageCommunity() {
  const { packageId } = useParams()
  const [searchParams] = useSearchParams()
  const title = searchParams.get('title') || 'Package'
  const { user } = useAuth()

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col gap-4">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link to="/agency/packages" className="font-medium text-primary-700 transition-colors hover:text-primary-800">
          Packages
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
        <span className="max-w-[min(100vw-10rem,280px)] truncate font-medium text-gray-800" title={title}>
          {title}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
        <span className="font-semibold text-gray-900">Chat</span>
      </nav>

      <div className="min-h-0 flex-1 overflow-hidden">
        <CommunityChat packageId={packageId} currentUserId={user?.id} layout="page" />
      </div>
    </div>
  )
}
