import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MapPin, Users, MessageSquare } from 'lucide-react'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import CommunityChat from '../components/CommunityChat.jsx'
import { joinUploadUrl } from '@/shared/config/api.js'

const getFullUrl = (path) => (path ? joinUploadUrl(path) : null)


export default function Community() {
  const { toast } = useToast()
  const location = useLocation()
  const statePackageId = location.state?.selectedPackageId

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    ; (async () => {
      try {
        const { data } = await axiosInstance.get('/customer/bookings')
        if (data?.success) {
          const seen = new Set()
          const unique = (data.data.bookings || [])
            .filter((b) => b.package?._id)
            .filter((b) => {
              if (seen.has(b.package._id)) return false
              seen.add(b.package._id)
              return true
            })
          setBookings(unique)
          if (unique.length > 0) {
            const target = statePackageId
              ? unique.find(b => b.package?._id === statePackageId)
              : unique[0]
            pickTrip(target || unique[0])
          }
        }
      } catch {
        toast.error('Failed to load communities')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const pickTrip = (b) => {
    setSelected({
      packageId: b.package._id,
      customerId: b.customer?._id,
      title: b.package.title,
      destination: b.package.destination,
      coverImage: b.package.coverImage,
      travelDate: b.travelDate,
      status: b.bookingStatus,
    })
    setSidebarOpen(false)
  }

  if (loading) return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Loader size="lg" text="Loading communities…" />
    </div>
  )

  if (bookings.length === 0) return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 text-center p-8">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-primary-200">
        <Users size={40} className="text-white" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">No Communities Yet</h2>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
          Book a trip to join its private community chat.
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-5.5rem)] overflow-hidden shadow-2xl shadow-gray-200/50 bg-white animate-fade-in">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── LEFT PANEL ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-[280px] lg:w-[30%] lg:min-w-[260px] lg:max-w-[310px]
        flex flex-col bg-gray-50 border-r border-gray-100
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Communities</h2>
          <p className="text-xs text-gray-400 mt-0.5">{bookings.length} {bookings.length === 1 ? 'trip' : 'trips'}</p>
        </div>

        {/* Trip list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {bookings.map((b) => {
            const pkg = b.package
            const isActive = selected?.packageId === pkg._id

            return (
              <button
                key={pkg._id}
                onClick={() => pickTrip(b)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${isActive ? 'bg-primary-50 border border-primary-200' : 'hover:bg-gray-100 border border-transparent'
                  }`}
              >
                {/* Square image */}
                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-primary-50 flex items-center justify-center border border-primary-100">
                  {pkg.coverImage
                    ? <img src={getFullUrl(pkg.coverImage)} alt={pkg.title} className="w-full h-full object-cover" />
                    : <MessageSquare size={18} className="text-primary-400" />
                  }
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary-700' : 'text-gray-800'}`}>
                    {pkg.title}
                  </p>
                  {pkg.destination && (
                    <p className="text-xs text-gray-400 truncate">{pkg.destination}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">{bookings.length} {bookings.length === 1 ? 'group' : 'groups'} joined</p>
        </div>
      </aside>

      {/* ── RIGHT CHAT PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">

        {selected ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CommunityChat
              key={selected.packageId}
              packageId={selected.packageId}
              customerId={selected.customerId}
              layout="page"
              flush
              onToggleSidebar={() => setSidebarOpen(true)}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50/50">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <MessageSquare size={28} className="text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Select a trip to chat</p>
          </div>
        )}
      </div>
    </div>
  )
}
