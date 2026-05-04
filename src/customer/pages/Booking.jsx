import { useEffect, useState, useRef } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  ChevronRight,
  ChevronLeft,
  Utensils,
  Activity,
  Info,
  LogOut,
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Ticket,
  X
} from 'lucide-react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import Loader from '@/shared/components/Loader.jsx'
import TicketsModal from '@/customer/components/TicketsModal.jsx'

const BASE_IMG_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const getFullUrl = (path) => path ? `${BASE_IMG_URL}/${path.replace(/\\/g, '/')}` : null

export default function Booking() {
  const navigate = useNavigate()
  const { bookingId: paramBookingId } = useParams()
  const { logout } = useAuth()
  const { toast } = useToast()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [currentImgIdx, setCurrentImgIdx] = useState(0)
  const [showTicketsModal, setShowTicketsModal] = useState(false)
  const [showInclusions, setShowInclusions] = useState(false)
  const [showExclusions, setShowExclusions] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const carouselTimer = useRef(null)

  useEffect(() => {
    let isMounted = true
    const fetchRequiredBooking = async () => {
      setLoading(true)
      try {
        let targetId = paramBookingId

        if (!targetId) {
          const { data: listRes } = await axiosInstance.get('/customer/bookings')
          if (listRes?.success && listRes.data?.bookings?.length > 0) {
            const bookings = listRes.data.bookings
            const now = new Date()
            const sorted = [...bookings].sort((a, b) => {
              const diffA = Math.abs(new Date(a.travelDate) - now)
              const diffB = Math.abs(new Date(b.travelDate) - now)
              return diffA - diffB
            })
            targetId = sorted[0].bookingId
          }
        }

        if (!targetId) {
          if (isMounted) setLoading(false)
          return
        }

        const { data } = await axiosInstance.get(`/customer/bookings/${targetId}`)
        if (!isMounted) return

        if (data?.success && data?.data?.booking) {
          setBooking(data.data.booking)
          if (data.data.booking.package?.itinerary?.length > 0) {
            setActiveDayIdx(0)
          }
        } else {
          toast.error(data?.message || 'Could not find booking details')
        }
      } catch (err) {
        if (isMounted) toast.error('Failed to fetch booking details')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchRequiredBooking()
    return () => { isMounted = false }
  }, [paramBookingId])

  const pkg = booking?.package || {}
  const wlPkg = booking?.whitelabelPackage || {}
  const itinerary = pkg.itinerary || []
  const activeDay = itinerary[activeDayIdx] || null

  const allImages = []
  const pkgImages = pkg.images || []
  const coverImg = pkg.coverImage

  if (coverImg) allImages.push(getFullUrl(coverImg))
  if (pkgImages.length > 0) {
    pkgImages.forEach(img => {
      const url = getFullUrl(img)
      if (url && !allImages.includes(url)) allImages.push(url)
    })
  }

  useEffect(() => {
    if (allImages.length > 1) {
      if (carouselTimer.current) clearInterval(carouselTimer.current)
      carouselTimer.current = setInterval(() => {
        setCurrentImgIdx(prev => (prev + 1) % allImages.length)
      }, 5000)
    }
    return () => clearInterval(carouselTimer.current)
  }, [allImages.length])

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader size="lg" text="Fetching itinerary…" /></div>
  }

  if (!booking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-4 rounded-full bg-red-50 p-4"><Info className="h-10 w-10 text-red-500" /></div>
        <h2 className="mb-2 text-xl font-bold text-gray-900 font-inter">No Booking Found</h2>
        <p className="text-gray-600 mb-6">We couldn't retrieve your booking details.</p>
      </div>
    )
  }

  const prevImage = () => setCurrentImgIdx(prev => (prev - 1 + allImages.length) % allImages.length)
  const nextImage = () => setCurrentImgIdx(prev => (prev + 1) % allImages.length)

  return (
    <>
      <div className="space-y-8 animate-fade-in pb-40">
        <style dangerouslySetInnerHTML={{
          __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none !important; }
        .scrollbar-hide { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}} />

        {/* Full-Screen Hero Carousel */}
        <div className="group relative h-screen w-full overflow-hidden bg-gray-950">
          {allImages.length > 0 ? (
            <div className="relative h-full w-full">
              {allImages.map((img, idx) => (
                <div key={idx} className={`absolute inset-0 transition-opacity duration-1500 ease-in-out ${idx === currentImgIdx ? 'opacity-100' : 'opacity-0'}`}>
                  <img src={img} alt={pkg.title} className="h-full w-full object-cover brightness-[0.6] transition-transform duration-[15s] scale-105 group-hover:scale-110" />
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

              {allImages.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-8 top-1/2 -translate-y-1/2 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-black/10 text-white backdrop-blur-xl border border-white/10 transition-all hover:bg-white/20 opacity-0 group-hover:opacity-100"><ChevronLeft size={32} /></button>
                  <button onClick={nextImage} className="absolute right-8 top-1/2 -translate-y-1/2 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-black/10 text-white backdrop-blur-xl border border-white/10 transition-all hover:bg-white/20 opacity-0 group-hover:opacity-100"><ChevronRight size={32} /></button>
                  <div className="absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 gap-3">
                    {allImages.map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentImgIdx(idx)} className={`h-1 rounded-full transition-all duration-500 ${idx === currentImgIdx ? 'w-10 bg-white' : 'w-3 bg-white/30'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-900 to-indigo-950">
              <h1 className="text-5xl font-black text-white opacity-10 uppercase tracking-widest">OnTrip Adventure</h1>
            </div>
          )}

          <div className="absolute inset-0 z-10 flex flex-col justify-end items-start text-left px-6 sm:px-12 md:px-16 pb-24 md:pb-32 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent">
            <div className="animate-fade-up max-w-4xl">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                {wlPkg.customTitle || pkg.title || 'Your Journey'}
              </h1>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 text-white font-bold bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
                  <MapPin className="h-5 w-5 text-primary-400" />
                  <span className="uppercase tracking-[0.2em] text-[10px] md:text-xs">{pkg.destination}</span>
                </div>
                <div className="flex items-center gap-3 text-white font-bold bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                  <span className="uppercase tracking-[0.2em] text-[10px] md:text-xs">{new Date(booking.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-30">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            
            {/* 1. Support / Agent Details */}
            <div className="flex items-center gap-5 w-full lg:w-auto shrink-0">
              {booking.bookedBy ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl font-black shadow-inner shrink-0">
                    {booking.bookedBy.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate mb-1">{booking.bookedBy.name}</p>
                    <a href={`tel:${booking.bookedBy.phone}`} className="inline-flex items-center gap-1.5 text-lg font-black text-gray-700 hover:text-primary-600 transition-colors">
                      <Phone size={16} />
                      {booking.bookedBy.phone}
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4 text-gray-400">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center"><Phone size={20} /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Support</p>
                    <p className="text-sm font-bold">No Agent Assigned</p>
                  </div>
                </div>
              )}
            </div>

            {/* Divider 1 */}
            <div className="hidden lg:block w-px h-16 bg-gray-100 dark:bg-gray-700 shrink-0"></div>
            <div className="lg:hidden w-full h-px bg-gray-100 dark:bg-gray-700"></div>

            {/* 2. Package Details Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 w-full lg:w-auto flex-1">
              <button
                onClick={() => setShowInclusions(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-sm transition-colors border border-emerald-100 active:scale-95"
              >
                <CheckCircle size={16} />
                Inclusions
              </button>
              <button
                onClick={() => setShowExclusions(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-sm transition-colors border border-rose-100 active:scale-95"
              >
                <XCircle size={16} />
                Exclusions
              </button>
              <button
                onClick={() => setShowNotes(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-sm transition-colors border border-amber-100 active:scale-95"
              >
                <Info size={16} />
                Important Notes
              </button>
            </div>

            {/* Divider 2 */}
            <div className="hidden lg:block w-px h-16 bg-gray-100 dark:bg-gray-700 shrink-0"></div>
            <div className="lg:hidden w-full h-px bg-gray-100 dark:bg-gray-700"></div>

            {/* 3. Quick Actions */}
            <div className="flex items-center justify-center gap-3 w-full lg:w-auto shrink-0">
              <Link
                to="/customer/community"
                state={{ selectedPackageId: booking.package?._id }}
                className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all active:scale-95"
                title="Community Chat"
              >
                <MessageSquare size={20} />
              </Link>
              <Link
                to={`/customer/booking/${booking.bookingId}/reviews/${booking.package?._id}?readOnly=false&status=${booking.bookingStatus}&bookingId=${booking.bookingId}`}
                className="p-3.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-all active:scale-95 group"
                title="Guest Experience"
              >
                <Star size={20} className="group-hover:fill-amber-600 transition-all" />
              </Link>
              <button
                onClick={() => setShowTicketsModal(true)}
                className="p-3.5 rounded-xl bg-cyan-50 text-cyan-600 hover:bg-cyan-100 hover:text-cyan-700 transition-all active:scale-95"
                title="Travel Tickets"
              >
                <Ticket size={20} />
              </button>
            </div>

          </div>
        </div>
        {/* Day Navigation & Action Bar */}
        <div className="sticky top-20 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl py-6 border-b border-gray-100 dark:border-white/5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-3 md:gap-5 overflow-x-auto scrollbar-hide w-full snap-x snap-mandatory px-2 py-2">
              {itinerary.map((day, idx) => {
                const isActive = activeDayIdx === idx

                let dayNumStr = `${idx + 1}`;
                let labelStr = 'Day';

                if (booking.travelDate) {
                  const dayDate = new Date(booking.travelDate);
                  dayDate.setDate(dayDate.getDate() + idx);
                  dayNumStr = dayDate.toLocaleDateString('en-IN', { day: '2-digit' });
                  labelStr = dayDate.toLocaleDateString('en-IN', { month: 'short' });
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setActiveDayIdx(idx)}
                    className={`flex flex-col items-center justify-center min-w-[70px] h-[70px] md:min-w-[80px] md:h-[80px] rounded-full border transition-all duration-300 snap-center outline-none shrink-0
                  ${isActive ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-200/50 scale-105' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-primary-200 dark:hover:border-primary-900 hover:bg-primary-50 dark:hover:bg-primary-900/20'}`}
                  >
                    <span className="text-xl md:text-2xl font-black mb-0.5">{dayNumStr}</span>
                    <span className={`text-[10px] md:text-[11px] font-bold tracking-wide capitalize ${isActive ? 'text-primary-50' : 'text-gray-400 dark:text-gray-500'}`}>{labelStr}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Active Day Header & Content */}
        {
          activeDay ? (
            <div className="w-full max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 mb-32">
              <div className="animate-fade-up">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-4">{activeDay.title || activeDay.name}</h2>
                <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-3xl">{activeDay.description || 'Discover new stories today.'}</p>
              </div>
              {/* Experiences List */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {(activeDay.experiences || []).map((exp, eIdx) => {
                  const vendor = exp.vendor || {}
                  return (
                    <div key={eIdx} className="bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/40 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-2xl hover:-translate-y-2 flex flex-col group">
                      {/* Image Frame */}
                      <div className="w-full h-48 md:h-56 shrink-0 bg-gray-50 dark:bg-gray-900 relative">
                        {exp.images?.[0] ? (
                          <img
                            src={getFullUrl(exp.images[0])}
                            alt={exp.name}
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : null}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 bg-gradient-to-br from-gray-50 to-gray-100" style={{ display: exp.images?.[0] ? 'none' : 'flex' }}>
                          <Activity size={40} strokeWidth={1.5} />
                          <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400">No Image</span>
                        </div>
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md shadow-sm text-primary-600 text-[10px] font-black uppercase tracking-widest border border-white">
                            {exp.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6 md:p-8 flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center gap-2 bg-primary-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg text-primary-600">
                            <Clock size={14} />
                            <span className="text-xs font-bold">{exp.startTime} {exp.endTime && `— ${exp.endTime}`}</span>
                          </div>
                        </div>

                        <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-tight mb-3 line-clamp-2">{exp.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-6 line-clamp-3">{exp.description}</p>

                        <div className="mt-auto pt-5 border-t border-gray-100 dark:border-gray-700">
                          {vendor.name ? (
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 font-bold">
                                  {vendor.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate">Activity Contact</p>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{vendor.name}</p>
                                </div>
                              </div>
                              <a
                                href={`tel:${vendor.phone}`}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm hover:bg-primary-600 dark:hover:bg-primary-500 hover:text-white transition-all shadow-md active:scale-95"
                              >
                                <Phone size={16} />
                                Call Vendor
                              </a>
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest py-2 text-center bg-gray-50 rounded-xl">No Vendor Assigned</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-[3rem] border-4 border-dashed border-gray-100 text-gray-300 font-black uppercase tracking-[0.3em] text-sm">Select A Day To Begin</div>
          )
        }

      </div >

      <TicketsModal
        isOpen={showTicketsModal}
        onClose={() => setShowTicketsModal(false)}
        tickets={booking.tickets}
      />

      {/* Inclusions Modal */}
      {showInclusions && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInclusions(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-emerald-600">
                <div className="p-2 rounded-xl bg-emerald-50"><CheckCircle size={24} /></div>
                <h3 className="text-lg font-black uppercase tracking-widest">What's Included</h3>
              </div>
              <button onClick={() => setShowInclusions(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={20} className="rotate-180" /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {pkg.inclusions && pkg.inclusions.length > 0 ? (
                pkg.inclusions.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-xl">No inclusions specified.</p>
              )}
            </div>
            <button onClick={() => setShowInclusions(false)} className="mt-8 w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">Close</button>
          </div>
        </div>
      )}

      {/* Exclusions Modal */}
      {showExclusions && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowExclusions(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 rounded-xl bg-rose-50"><XCircle size={24} /></div>
                <h3 className="text-lg font-black uppercase tracking-widest">What's Excluded</h3>
              </div>
              <button onClick={() => setShowExclusions(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={20} className="rotate-180" /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {pkg.exclusions && pkg.exclusions.length > 0 ? (
                pkg.exclusions.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-xl">No exclusions specified.</p>
              )}
            </div>
            <button onClick={() => setShowExclusions(false)} className="mt-8 w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">Close</button>
          </div>
        </div>
      )}

      {/* Important Notes Modal */}
      {showNotes && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNotes(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="p-2 rounded-xl bg-amber-50"><Info size={24} /></div>
                <h3 className="text-lg font-black uppercase tracking-widest">Important Notes</h3>
              </div>
              <button onClick={() => setShowNotes(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={20} className="rotate-180" /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {pkg.importantNotes && pkg.importantNotes.length > 0 ? (
                pkg.importantNotes.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-xl">No important notes specified.</p>
              )}
            </div>
            <button onClick={() => setShowNotes(false)} className="mt-8 w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">Close</button>
          </div>
        </div>
      )}
    </>
  )
}
