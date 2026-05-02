import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MapPin, Users, MessageSquare } from 'lucide-react'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import CommunityChat from '../components/CommunityChat.jsx'

const BASE_IMG_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') ||
  'http://localhost:5001'
const getFullUrl = (path) =>
  path ? `${BASE_IMG_URL}/${path.replace(/\\/g, '/')}` : null

import { Search, MoreHorizontal, Info } from 'lucide-react'


export default function Community() {
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  // Read ?pkg= from URL — this is the source of truth for which chat is open
  const urlPackageId = new URLSearchParams(location.search).get('pkg')

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const pickTrip = useCallback((b, replace = false) => {
    const pkgId = b.package._id
    // Update URL — this drives the selected state
    navigate(`/customer/community?pkg=${pkgId}`, { replace })
    setSidebarOpen(false)
  }, [navigate])

  useEffect(() => {
    ;(async () => {
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
            // If URL already has a pkg param, honour it; else pick first
            const hasUrlParam = urlPackageId && unique.some(b => b.package._id === urlPackageId)
            if (!hasUrlParam) {
              pickTrip(unique[0], true)
            }
          }
        }
      } catch {
        toast.error('Failed to load communities')
      } finally {
        setLoading(false)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync selected state whenever URL param or bookings change
  useEffect(() => {
    if (!bookings.length || !urlPackageId) return
    const match = bookings.find(b => b.package._id === urlPackageId)
    if (match) {
      setSelected({
        packageId: match.package._id,
        customerId: match.customer?._id,
        title: match.package.title,
        destination: match.package.destination,
        coverImage: match.package.coverImage,
        travelDate: match.travelDate,
        status: match.bookingStatus,
      })
    }
  }, [urlPackageId, bookings])

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
    <div className="flex h-[calc(100vh-7rem)] rounded-[2rem] overflow-hidden shadow-2xl shadow-gray-200/50 bg-white animate-fade-in">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── LEFT PANEL (Community List) ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-[320px] lg:w-[350px]
        flex flex-col bg-white border-r border-gray-100/50
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Header with Search */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Messages</h1>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
               <Users size={16} />
            </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search your trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Trip list */}
        <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar">
          {bookings
            .filter(b => b.package.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.package.destination.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((b) => {
              const pkg = b.package
              const isActive = urlPackageId === pkg._id

              return (
                <button
                  key={pkg._id}
                  onClick={() => pickTrip(b)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 relative transition-colors border-b border-gray-100 last:border-none ${
                    isActive 
                      ? 'bg-primary-50/40 hover:bg-primary-50/60' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* Active Indicator Left Border */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isActive ? 'bg-primary-500' : 'bg-transparent'}`} />

                  {/* Circular image */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-gray-100">
                      {pkg.coverImage
                        ? <img src={getFullUrl(pkg.coverImage)} alt={pkg.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center">
                            <MessageSquare size={18} className="text-white/90" />
                          </div>
                      }
                    </div>
                    {/* Mock online/active status indicator on avatar */}
                    {isActive && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-primary-500 border-2 border-white" />
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className={`text-sm font-bold truncate transition-colors ${isActive ? 'text-gray-900' : 'text-gray-800'}`}>
                        {pkg.title}
                      </p>
                      <span className="text-[11px] text-gray-400 font-medium tabular-nums ml-2 shrink-0">
                        {b.lastMessage 
                          ? new Date(b.lastMessage.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
                          : new Date(b.travelDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-[13px] truncate ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                        {b.lastMessage 
                          ? (b.lastMessage.type === 'image' 
                              ? '📷 Photo' 
                              : b.lastMessage.type === 'video' 
                                ? '📹 Video' 
                                : b.lastMessage.content) 
                          : 'Tap to chat with fellow travelers...'}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
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
              onToggleSidebar={() => setSidebarOpen(true)}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 bg-gray-50/30 p-12 text-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center text-primary-500 transform -rotate-6 animate-float">
                <MessageSquare size={56} strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-primary-600 shadow-xl flex items-center justify-center text-white transform rotate-12">
                <Users size={20} />
              </div>
            </div>
            
            <div className="max-w-xs space-y-3">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Your Travel Circles</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Connect with fellow explorers on your upcoming trips. Share tips, photos, and memories in real-time.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-400">
                   Select a trip to begin
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
