import { useEffect, useState, useRef } from 'react'
import {
  Calendar, Clock, MapPin, Phone, ChevronRight, ChevronLeft,
  Utensils, Activity, Info, LogOut, MessageSquare, Star,
  CheckCircle, XCircle, Ticket, X, Plane, Hotel, Car,
  Camera, AlertTriangle, Hash, Sun, Bed, Users, Image,
} from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import Loader from '@/shared/components/Loader.jsx'
import TicketsModal from '@/customer/components/TicketsModal.jsx'
import VendorChatModal from '@/customer/components/VendorChatModal.jsx'

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const toUrl = (p) => p ? `${BASE_URL}/${p.replace(/\\/g, '/')}` : null

const CAT_STYLE = {
  hotel_checkin:  { icon: Hotel,    bg: 'bg-sky-500',      label: 'Check-In'  },
  hotel_checkout: { icon: Hotel,    bg: 'bg-sky-400',      label: 'Check-Out' },
  transfer:       { icon: Car,      bg: 'bg-amber-500',    label: 'Transfer'  },
  meal:           { icon: Utensils, bg: 'bg-orange-500',   label: 'Meal'      },
  activity:       { icon: Activity, bg: 'bg-emerald-500',  label: 'Activity'  },
}
const STATUS = {
  confirmed: { label: 'Confirmed', ring: 'ring-emerald-400/60', dot: 'bg-emerald-400' },
  pending:   { label: 'Pending',   ring: 'ring-amber-400/60',   dot: 'bg-amber-400'   },
  completed: { label: 'Completed', ring: 'ring-blue-400/60',    dot: 'bg-blue-400'    },
  cancelled: { label: 'Cancelled', ring: 'ring-red-400/60',     dot: 'bg-red-400'     },
}

const TABS = ['Overview', 'Itinerary', 'Gallery', 'Details']

export default function Booking() {
  const { bookingId: paramId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { toast } = useToast()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Overview')
  const [dayIdx, setDayIdx] = useState(0)
  const [lb, setLb] = useState({ open: false, idx: 0 })
  const [showTickets, setShowTickets] = useState(false)
  const [chatVendor, setChatVendor] = useState(null)
  const tabBarRef = useRef(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        let id = paramId
        if (!id) {
          const { data } = await axiosInstance.get('/customer/bookings')
          if (data?.success && data.data?.bookings?.length) {
            const now = new Date()
            id = [...data.data.bookings]
              .sort((a, b) => Math.abs(new Date(a.travelDate) - now) - Math.abs(new Date(b.travelDate) - now))[0].bookingId
          }
        }
        if (!id) { if (alive) setLoading(false); return }
        const { data } = await axiosInstance.get(`/customer/bookings/${id}`)
        if (alive && data?.success) setBooking(data.data.booking)
      } catch { if (alive) toast.error('Failed to load booking') }
      finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [paramId])

  useEffect(() => {
    const vid = searchParams.get('chatVendor')
    if (!vid || !booking?.package?.itinerary) return
    for (const day of booking.package.itinerary)
      for (const exp of day.experiences || [])
        if (String(exp.vendor?._id || exp.vendor?.id) === vid) {
          setChatVendor(exp.vendor)
          const p = new URLSearchParams(searchParams); p.delete('chatVendor')
          setSearchParams(p, { replace: true }); return
        }
  }, [booking, searchParams])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Loader size="lg" text="Loading your trip…" />
    </div>
  )

  if (!booking) return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center">
          <Plane size={28} className="text-primary-600" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">No Booking Found</h2>
        <p className="text-sm text-gray-500 mb-6">Contact your travel admin to get a package assigned.</p>
        <button onClick={() => { logout(); navigate('/customer/login', { replace: true }) }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  )

  const pkg = booking.package || {}
  const wlPkg = booking.whitelabelPackage || {}
  const itinerary = pkg.itinerary || []
  const days = pkg.totalDays || itinerary.length || 0
  const nights = days > 1 ? days - 1 : 0
  const statusCfg = STATUS[booking.bookingStatus] || STATUS.confirmed
  const travelDate = booking.travelDate
    ? new Date(booking.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
  const activeDay = itinerary[dayIdx] || null

  const images = []
  if (pkg.coverImage) images.push(toUrl(pkg.coverImage))
  ;(pkg.images || []).forEach(p => { const u = toUrl(p); if (u && !images.includes(u)) images.push(u) })

  const coverImg = images[0]

  return (
    <>
      <style>{`.noscroll::-webkit-scrollbar{display:none}.noscroll{-ms-overflow-style:none;scrollbar-width:none}`}</style>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

        {/* ═══════════════════ HERO ═══════════════════ */}
        <div className="relative h-[55vh] min-h-[380px] overflow-hidden">
          {/* Background blurred photo */}
          {coverImg ? (
            <img src={coverImg} alt="" className="absolute inset-0 h-full w-full object-cover scale-110" style={{ filter: 'blur(2px) brightness(0.45)' }} />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Centered glass card */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 text-center">
            {/* Status pill */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ring-1 ${statusCfg.ring} bg-white/10 backdrop-blur-sm mb-4`}>
              <span className={`h-2 w-2 rounded-full ${statusCfg.dot} animate-pulse`} />
              <span className="text-white text-xs font-bold tracking-wide">{statusCfg.label}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight max-w-3xl drop-shadow-lg">
              {wlPkg.customTitle || pkg.title || 'Your Journey'}
            </h1>

            {/* Key stats row */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {[
                { icon: MapPin,    val: pkg.destination },
                { icon: Calendar, val: travelDate },
                { icon: Sun,      val: days > 0 ? `${days}D · ${nights}N` : null },
              ].filter(s => s.val).map(({ icon: Icon, val }) => (
                <span key={val} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white text-sm font-semibold px-4 py-1.5 rounded-full border border-white/20">
                  <Icon size={13} className="opacity-70" />{val}
                </span>
              ))}
            </div>

            {/* Cover photo thumbnail strip (if multiple) */}
            {images.length > 1 && (
              <button onClick={() => { setTab('Gallery'); setTimeout(() => window.scrollTo({ top: 200, behavior: 'smooth' }), 50) }}
                className="mt-5 flex items-center gap-2 text-white/70 text-xs font-semibold hover:text-white transition-colors">
                <Camera size={13} /> {images.length} photos — View gallery
              </button>
            )}
          </div>
        </div>

        {/* ═══════════════════ TAB BAR ═══════════════════ */}
        <div ref={tabBarRef} className="sticky top-20 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex overflow-x-auto noscroll">
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`relative shrink-0 px-5 py-4 text-sm font-bold transition-colors ${
                    tab === t
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}>
                  {t}
                  {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════ CONTENT ═══════════════════ */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-10">

          {/* ── OVERVIEW ────────────────────────────────── */}
          {tab === 'Overview' && (
            <div className="space-y-8">
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Booking ID',  value: booking.bookingId, icon: Hash,     color: 'text-primary-600 bg-primary-50 dark:bg-primary-950/30' },
                  { label: 'Duration',    value: days > 0 ? `${days} Days, ${nights} Nights` : '—', icon: Sun, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
                  { label: 'Destination', value: pkg.destination || '—', icon: MapPin,  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
                  { label: 'Travel Date', value: travelDate, icon: Calendar, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-2">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon size={16} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none">{label}</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              {pkg.description && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">About This Trip</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{pkg.description}</p>
                </div>
              )}

              {/* Agent card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Your Travel Agent</p>
                </div>
                {booking.bookedBy ? (
                  <div className="p-6 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 font-black text-xl flex items-center justify-center shrink-0">
                      {booking.bookedBy.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 dark:text-white">{booking.bookedBy.name}</p>
                      {booking.bookedBy.phone && (
                        <a href={`tel:${booking.bookedBy.phone}`} className="text-sm text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1 mt-0.5">
                          <Phone size={12} />{booking.bookedBy.phone}
                        </a>
                      )}
                    </div>
                    {booking.bookedBy.phone && (
                      <a href={`tel:${booking.bookedBy.phone}`}
                        className="h-11 w-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200/50 dark:shadow-none shrink-0">
                        <Phone size={18} />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-sm text-gray-400 text-center py-8">No agent assigned yet</div>
                )}
              </div>

              {/* Action row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Ticket,        label: 'My Tickets',   sub: 'Vouchers & docs',  onClick: () => setShowTickets(true),   bg: 'from-cyan-500 to-cyan-600' },
                  { icon: MessageSquare, label: 'Community',    sub: 'Chat with group',  to: '/customer/community',             bg: 'from-indigo-500 to-indigo-600' },
                  { icon: Star,          label: 'Rate Trip',    sub: 'Leave a review',   to: `/customer/booking/${booking.bookingId}/reviews/${pkg._id}?readOnly=false&status=${booking.bookingStatus}&bookingId=${booking.bookingId}`, bg: 'from-amber-500 to-amber-600' },
                ].map(({ icon: Icon, label, sub, onClick, to, bg }) => (
                  to ? (
                    <Link key={label} to={to}
                      className={`flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-gradient-to-br ${bg} text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all`}>
                      <Icon size={22} strokeWidth={1.8} />
                      <div className="text-center">
                        <p className="text-xs font-black">{label}</p>
                        <p className="text-[10px] opacity-70">{sub}</p>
                      </div>
                    </Link>
                  ) : (
                    <button key={label} onClick={onClick}
                      className={`flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-gradient-to-br ${bg} text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all`}>
                      <Icon size={22} strokeWidth={1.8} />
                      <div className="text-center">
                        <p className="text-xs font-black">{label}</p>
                        <p className="text-[10px] opacity-70">{sub}</p>
                      </div>
                    </button>
                  )
                ))}
              </div>
            </div>
          )}

          {/* ── ITINERARY ───────────────────────────────── */}
          {tab === 'Itinerary' && (
            <div className="space-y-6">
              {itinerary.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <Bed size={40} className="mx-auto mb-3 opacity-30" strokeWidth={1.5} />
                  <p className="font-bold">No itinerary added yet</p>
                </div>
              ) : (
                <>
                  {/* Day tabs */}
                  <div className="flex gap-2 overflow-x-auto noscroll pb-1">
                    {itinerary.map((_, i) => {
                      let label = `Day ${i + 1}`
                      let sub = ''
                      if (booking.travelDate) {
                        const d = new Date(booking.travelDate); d.setDate(d.getDate() + i)
                        label = d.toLocaleDateString('en-IN', { day: 'numeric' })
                        sub   = d.toLocaleDateString('en-IN', { month: 'short' })
                      }
                      const isActive = dayIdx === i
                      return (
                        <button key={i} onClick={() => setDayIdx(i)}
                          className={`shrink-0 flex flex-col items-center w-14 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                            isActive
                              ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200/50 scale-105'
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-200 hover:text-primary-600'
                          }`}>
                          <span className="text-lg font-black leading-none">{label}</span>
                          {sub && <span className={`text-[10px] mt-0.5 ${isActive ? 'text-primary-200' : 'text-gray-400'}`}>{sub}</span>}
                        </button>
                      )
                    })}
                  </div>

                  {/* Active day content */}
                  {activeDay && (
                    <div>
                      {/* Day header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-2xl bg-primary-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                          {dayIdx + 1}
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                            {activeDay.title || activeDay.name || `Day ${dayIdx + 1}`}
                          </h2>
                          {activeDay.description && (
                            <p className="text-sm text-gray-500 mt-0.5">{activeDay.description}</p>
                          )}
                        </div>
                      </div>

                      {(activeDay.experiences || []).length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {(activeDay.experiences || []).map((exp, ei) => {
                            const cat = CAT_STYLE[exp.type] || { icon: Activity, bg: 'bg-gray-500', label: 'Experience' }
                            const Icon = cat.icon
                            const expImg = exp.images?.[0] ? toUrl(exp.images[0]) : null
                            const vendor = exp.vendor || {}

                            return (
                              <div key={ei} className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                                {/* Image header */}
                                <div className="relative h-44 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                  {expImg ? (
                                    <img src={expImg} alt={exp.name}
                                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                  ) : (
                                    <div className={`h-full flex items-center justify-center ${cat.bg} bg-opacity-10`}>
                                      <Icon size={44} className={`${cat.bg.replace('bg-', 'text-')} opacity-40`} strokeWidth={1} />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                                  {/* Category badge */}
                                  <div className="absolute top-3 left-3">
                                    <span className={`flex items-center gap-1.5 ${cat.bg} text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wide`}>
                                      <Icon size={10} />{cat.label}
                                    </span>
                                  </div>

                                  {/* Time badge */}
                                  {exp.startTime && (
                                    <div className="absolute top-3 right-3">
                                      <span className="flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                                        <Clock size={10} />{exp.startTime}{exp.endTime ? ` — ${exp.endTime}` : ''}
                                      </span>
                                    </div>
                                  )}

                                  {/* Vendor name on image */}
                                  {vendor.name && (
                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                      <span className="text-white text-xs font-semibold truncate">{vendor.name}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Body */}
                                <div className="p-4">
                                  <h3 className="font-black text-gray-900 dark:text-white leading-snug mb-1">{exp.name}</h3>
                                  {exp.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{exp.description}</p>
                                  )}

                                  {vendor.name && vendor.phone && (
                                    <div className="flex gap-2 mt-4">
                                      <a href={`tel:${vendor.phone}`}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:bg-primary-600 dark:hover:bg-primary-100 transition-colors">
                                        <Phone size={13} /> Call
                                      </a>
                                      <button onClick={() => setChatVendor(vendor)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 transition-colors">
                                        <MessageSquare size={13} /> Chat
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-16 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-center">
                          <Sun size={36} className="text-amber-300 mb-2" strokeWidth={1.5} />
                          <p className="font-bold text-gray-400 text-sm">Free day — enjoy some rest!</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── GALLERY ─────────────────────────────────── */}
          {tab === 'Gallery' && (
            <div>
              {images.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-gray-400">
                  <Image size={48} className="mb-3 opacity-30" strokeWidth={1.5} />
                  <p className="font-bold">No photos available</p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">{images.length} Photos</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {images.map((src, i) => (
                      <button key={i} onClick={() => setLb({ open: true, idx: i })}
                        className={`group relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800 hover:shadow-lg transition-all ${
                          i === 0 ? 'col-span-2 sm:col-span-2 aspect-[16/9]' : 'aspect-square'
                        }`}>
                        <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center">
                            <Camera size={16} className="text-gray-700" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── DETAILS ─────────────────────────────────── */}
          {tab === 'Details' && (
            <div className="space-y-6">
              {/* Inclusions */}
              {pkg.inclusions?.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-emerald-50/50 dark:bg-emerald-950/10">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <h3 className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">What's Included</h3>
                  </div>
                  <ul className="p-6 grid sm:grid-cols-2 gap-3">
                    {pkg.inclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-500" strokeWidth={2.5} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Exclusions */}
              {pkg.exclusions?.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-rose-50/50 dark:bg-rose-950/10">
                    <XCircle size={16} className="text-rose-500" />
                    <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Not Included</h3>
                  </div>
                  <ul className="p-6 grid sm:grid-cols-2 gap-3">
                    {pkg.exclusions.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <XCircle size={16} className="shrink-0 mt-0.5 text-rose-400" strokeWidth={2.5} />
                        <span className="text-sm text-gray-500 dark:text-gray-400">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Important Notes */}
              {pkg.importantNotes?.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-amber-50/50 dark:bg-amber-950/10">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <h3 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Important Notes</h3>
                  </div>
                  <div className="p-6 space-y-3">
                    {pkg.importantNotes.map((note, i) => (
                      <div key={i} className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl px-4 py-3 border border-amber-100 dark:border-amber-900/30">
                        <span className="shrink-0 h-5 w-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-[10px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                        <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!pkg.inclusions?.length && !pkg.exclusions?.length && !pkg.importantNotes?.length && (
                <div className="text-center py-20 text-gray-400">
                  <Info size={40} className="mx-auto mb-3 opacity-30" strokeWidth={1.5} />
                  <p className="font-bold">No details available</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ═══════════════════ LIGHTBOX ═══════════════════ */}
      {lb.open && (
        <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 shrink-0">
            <span className="text-white/50 text-sm">{lb.idx + 1} / {images.length}</span>
            <button onClick={() => setLb({ open: false, idx: 0 })}
              className="h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative px-4">
            <button onClick={() => setLb(s => ({ ...s, idx: (s.idx - 1 + images.length) % images.length }))}
              className="absolute left-4 h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition-colors z-10">
              <ChevronLeft size={24} />
            </button>
            <img src={images[lb.idx]} alt="" className="max-h-[75vh] max-w-full rounded-xl object-contain" />
            <button onClick={() => setLb(s => ({ ...s, idx: (s.idx + 1) % images.length }))}
              className="absolute right-4 h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition-colors z-10">
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto noscroll px-6 py-4 justify-center shrink-0">
            {images.map((src, i) => (
              <button key={i} onClick={() => setLb(s => ({ ...s, idx: i }))}
                className={`shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all ${i === lb.idx ? 'border-white scale-105' : 'border-white/15 opacity-50 hover:opacity-80'}`}>
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <TicketsModal isOpen={showTickets} onClose={() => setShowTickets(false)} tickets={booking.tickets} />
      <VendorChatModal isOpen={!!chatVendor} onClose={() => setChatVendor(null)} bookingId={booking.bookingId || booking._id} vendor={chatVendor} />
    </>
  )
}
