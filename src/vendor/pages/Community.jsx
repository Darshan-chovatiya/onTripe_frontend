import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MessageSquare, Users, Search } from 'lucide-react'
import { getVendorCommunities } from '@/vendor/services/vendorApi.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import CommunityChat from '@/customer/components/CommunityChat.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'

const BASE_IMG_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') ||
  'http://localhost:5001'

const getFullUrl = (path) =>
  path ? `${BASE_IMG_URL}/${String(path).replace(/\\/g, '/')}` : null

export default function VendorCommunity() {
  const { toast } = useToast()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const urlPackageId = new URLSearchParams(location.search).get('pkg')

  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const pickCommunity = useCallback(
    (c, replace = false) => {
      navigate(`/vendor/community?pkg=${c.packageId}`, { replace })
      setSidebarOpen(false)
    },
    [navigate]
  )

  useEffect(() => {
    ;(async () => {
      try {
        const res = await getVendorCommunities()
        if (res.data?.success) {
          const list = res.data.data.communities || []
          setCommunities(list)
          if (list.length > 0) {
            const hasUrl = urlPackageId && list.some((c) => c.packageId === urlPackageId)
            if (!hasUrl) pickCommunity(list[0], true)
          }
        }
      } catch {
        toast.error('Failed to load package communities')
      } finally {
        setLoading(false)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!communities.length || !urlPackageId) return
    const match = communities.find((c) => c.packageId === urlPackageId)
    if (match) {
      setSelected({
        packageId: match.packageId,
        title: match.title,
        destination: match.destination,
        coverImage: match.coverImage,
      })
    }
  }, [urlPackageId, communities])

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader size="lg" text="Loading communities…" />
      </div>
    )
  }

  if (communities.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-indigo-600 shadow-2xl shadow-primary-200">
          <Users size={40} className="text-white" />
        </div>
        <div>
          <h2 className="mb-2 text-2xl font-black text-gray-900">No package communities yet</h2>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-gray-500">
            When you are assigned to a package itinerary, you will be added to that trip&apos;s group chat automatically.
          </p>
        </div>
      </div>
    )
  }

  const filtered = communities.filter(
    (c) =>
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.destination?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-7rem)] animate-fade-in overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-gray-200/50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[320px] flex-col border-r border-gray-100/50 bg-white transition-all duration-300 ease-in-out lg:static lg:z-auto lg:w-[350px] ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Communities</h1>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400">
              <MessageSquare size={16} />
            </div>
          </div>
          <div className="group relative">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border-none bg-gray-50 py-3 pl-11 pr-4 text-sm transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto pb-6">
          {filtered.map((c) => {
            const isActive = urlPackageId === c.packageId
            const lm = c.lastMessage
            return (
              <button
                key={c.packageId}
                type="button"
                onClick={() => pickCommunity(c)}
                className={`relative w-full border-b border-gray-100 px-4 py-3.5 text-left transition-colors last:border-none ${
                  isActive ? 'bg-primary-50/40 hover:bg-primary-50/60' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div
                  className={`absolute bottom-0 left-0 top-0 w-1 transition-colors ${
                    isActive ? 'bg-primary-500' : 'bg-transparent'
                  }`}
                />
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {c.coverImage ? (
                      <img src={getFullUrl(c.coverImage)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-400 to-indigo-500">
                        <MessageSquare size={18} className="text-white/90" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-800'}`}>
                      {c.title}
                    </p>
                    <p className={`truncate text-[13px] ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                      {lm
                        ? lm.type === 'image'
                          ? '📷 Photo'
                          : lm.type === 'video'
                            ? '📹 Video'
                            : lm.content
                        : c.destination || 'Group chat'}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col bg-white">
        {selected ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CommunityChat
              key={selected.packageId}
              packageId={selected.packageId}
              currentUserId={user?.id}
              onToggleSidebar={() => setSidebarOpen(true)}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-gray-50/30 p-12 text-center">
            <MessageSquare size={56} className="text-gray-200" strokeWidth={1.5} />
            <div className="max-w-xs space-y-3">
              <h3 className="text-2xl font-black tracking-tight text-gray-900">Package group chats</h3>
              <p className="text-sm font-medium leading-relaxed text-gray-500">
                Select a package to chat with agents, travelers, and other vendors on the same trip.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
