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
  Ticket
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
      `}} />

        {/* Hero Carousel */}
        <div className="group relative h-[380px] md:h-[480px] w-full overflow-hidden rounded-[2.5rem] bg-gray-900 shadow-2xl">
          {allImages.length > 0 ? (
            <div className="relative h-full w-full">
              {allImages.map((img, idx) => (
                <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentImgIdx ? 'opacity-100' : 'opacity-0'}`}>
                  <img src={img} alt={pkg.title} className="h-full w-full object-cover brightness-[0.75] transition-transform duration-[10s] group-hover:scale-110" />
                </div>
              ))}
              {allImages.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl border border-white/20 transition-all hover:bg-white/30 opacity-0 group-hover:opacity-100"><ChevronLeft size={28} /></button>
                  <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-xl border border-white/20 transition-all hover:bg-white/30 opacity-0 group-hover:opacity-100"><ChevronRight size={28} /></button>
                  <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                    {allImages.map((_, idx) => (
                      <button key={idx} onClick={() => setCurrentImgIdx(idx)} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImgIdx ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-indigo-700">
              <h1 className="text-4xl font-bold text-white opacity-20 uppercase tracking-tighter">OnTrip Journey</h1>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-8 md:p-16 text-white flex flex-col items-center text-center">
            <h1 className="max-w-4xl text-3xl font-black tracking-tight md:text-7xl drop-shadow-2xl leading-[1.1]">
              {wlPkg.customTitle || pkg.title || 'Your Journey'}
            </h1>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <p className="flex items-center gap-2.5 font-black text-white px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5">
                <MapPin className="h-5 w-5 text-primary-400" />
                <span className="uppercase tracking-[0.2em] text-[10px] md:text-xs">{pkg.destination}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Agency Support */}
          <div className="rounded-[2.5rem] bg-white dark:bg-gray-800 p-8 shadow-xl shadow-gray-100/50 border border-gray-100 dark:border-white/5 relative overflow-hidden h-full">

            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-primary-600">
              Support & Assistance
            </h3>

            {booking.bookedBy ? (
              <div className="space-y-6">

                {/* Agent Info */}
                <div className="flex items-center gap-5">

                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 text-xl font-black shadow-inner">
                    {booking.bookedBy.name.charAt(0)}
                  </div>

                  {/* Name + Phone swapped */}
                  <div>
                    {/* Small text = Name */}
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
                      {booking.bookedBy.name}
                    </p>

                    <a
                      href={`tel:${booking.bookedBy.phone}`}>
                      <p className="text-xl font-black text-gray-900 dark:text-white">
                        {booking.bookedBy.phone}
                      </p>
                    </a>
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <Phone className="mb-2 opacity-20" size={32} />
                <p className="text-xs font-bold">No Contact Support</p>
              </div>
            )}
          </div>

          {/* Inclusions */}
          <div className="rounded-[2.5rem] bg-white dark:bg-gray-800 p-8 shadow-xl shadow-gray-100/50 border border-gray-100 dark:border-white/5 relative overflow-hidden h-full">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-green-600">Package Inclusions</h3>
            <div className="space-y-3 max-h-[160px] overflow-y-auto scrollbar-hide pr-2">
              {pkg.inclusions && pkg.inclusions.length > 0 ? (
                pkg.inclusions.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="mt-1 p-0.5 rounded-full bg-green-50 text-green-500 shrink-0"><CheckCircle size={14} /></div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight">{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No inclusions specified</p>
              )}
            </div>
          </div>

          {/* Exclusions */}
          <div className="rounded-[2.5rem] bg-white dark:bg-gray-800 p-8 shadow-xl shadow-gray-100/50 border border-gray-100 dark:border-white/5 relative overflow-hidden h-full">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-red-600">Package Exclusions</h3>
            <div className="space-y-3 max-h-[160px] overflow-y-auto scrollbar-hide pr-2">
              {pkg.exclusions && pkg.exclusions.length > 0 ? (
                pkg.exclusions.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="mt-1 p-0.5 rounded-full bg-red-50 text-red-500 shrink-0"><XCircle size={14} /></div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight">{item}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No exclusions specified</p>
              )}
            </div>
          </div>
        </div>
        {/* Day Navigation & Action Bar */}
        <div className="sticky top-16 z-40 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md py-4 px-4 -mx-4 border-b border-gray-100 dark:border-white/5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex gap-3 md:gap-5 overflow-x-auto scrollbar-hide flex-1 snap-x snap-mandatory">
              {itinerary.map((day, idx) => {
                const isActive = activeDayIdx === idx
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveDayIdx(idx)}
                    className={`flex flex-col items-center justify-center min-w-[70px] h-[70px] md:min-w-[80px] md:h-[80px] rounded-2xl border transition-all duration-300 snap-center outline-none
                  ${isActive ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200' : 'bg-white border-gray-100 text-gray-500 hover:border-primary-200'}`}
                  >
                    <span className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isActive ? 'text-primary-100' : 'text-gray-400'}`}>Day</span>
                    <span className="text-xl md:text-2xl font-black">{day.day}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/customer/community"
                state={{ selectedPackageId: booking.package?._id }}
                className="p-4 rounded-2xl bg-white border border-gray-100 shadow-md text-gray-600 hover:text-primary-600 transition-all active:scale-95 flex items-center justify-center shrink-0"
                title="Community Chat"
              >
                <MessageSquare size={20} />
              </Link>
              <Link
                to={`/customer/booking/${booking.bookingId}/reviews/${booking.package?._id}?readOnly=false&status=${booking.bookingStatus}&bookingId=${booking.bookingId}`}
                className="px-5 py-4 rounded-2xl bg-white border border-gray-100 shadow-md flex items-center gap-2 group hover:border-amber-200 transition-all active:scale-95 shrink-0"
                title="Guest Experience"
              >
                <Star size={20} className="text-amber-400 group-hover:fill-amber-400 transition-all" />
              </Link>
              <button
                onClick={() => setShowTicketsModal(true)}
                className="p-4 rounded-2xl bg-white border border-gray-100 shadow-md text-gray-600 hover:text-indigo-600 transition-all active:scale-95 flex items-center justify-center shrink-0"
                title="Travel Tickets"
              >
                <Ticket size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Day Header */}
        {
          activeDay ? (
            <div className="w-full space-y-8 px-4">
              <div className="rounded-[2.5rem] bg-white dark:bg-gray-800 p-8 md:p-12 shadow-2xl shadow-gray-100/50 border border-gray-50 dark:border-white/5 relative overflow-hidden text-center max-w-5xl mx-auto">
                <h2 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6">{activeDay.title}</h2>
                <p className="text-lg md:text-xl text-gray-400 dark:text-gray-400 font-medium leading-relaxed max-w-3xl mx-auto">{activeDay.description || 'Discover new stories today.'}</p>
              </div>
              {/* Experiences List */}
              <div className="space-y-8 md:pl-10 md:border-l-2 border-gray-100 dark:border-white/5">
                {(activeDay.experiences || []).map((exp, eIdx) => {
                  const vendor = exp.vendor || {}
                  return (
                    <div key={eIdx} className="relative group">
                      <div className="absolute -left-[63px] top-8 hidden md:flex w-11 items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-600 shadow-[0_0_15px_rgba(37,99,235,0.6)] ring-8 ring-primary-50 dark:ring-primary-950" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-4 md:p-6 shadow-xl shadow-gray-100/40 border border-gray-100 dark:border-white/5 transition-all hover:translate-x-2">
                        <div className="flex flex-col lg:flex-row gap-8">
                          {/* Image Frame */}
                          <div className="w-full lg:w-72 h-48 lg:h-auto shrink-0 rounded-[2rem] overflow-hidden bg-gray-50 dark:bg-white/5 relative group/img">
                            {exp.images?.[0] ? (
                              <img src={getFullUrl(exp.images[0])} alt={exp.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
                                <Activity size={40} strokeWidth={1.5} />
                                <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Experience Image</span>
                              </div>
                            )}
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end opacity-0 group-hover/img:opacity-100 transition-all">
                              <span className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/10">View Gallery</span>
                            </div>
                          </div>

                          <div className="flex-1 py-2 space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 px-5 py-2.5 rounded-2xl border border-gray-100 dark:border-white/5">
                                <Clock size={16} className="text-primary-500" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">{exp.startTime} {exp.endTime && <span className="mx-2 opacity-20">—</span>} {exp.endTime}</span>
                              </div>
                              <span className="px-5 py-2.5 rounded-2xl bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{exp.category}</span>
                            </div>

                            <div className='flex items-center justify-between'>
                              <div className="flex flex-col">
                                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-tight mb-4">{exp.name}</h3>
                                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{exp.description}</p>
                              </div>
                              <div className="border-t border-gray-50 dark:border-white/5">
                                {vendor.name && (
                                  <div className="ml-auto flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Point of Contact</p>
                                      <p className="text-sm font-black text-gray-900 dark:text-white">{vendor.name}</p>
                                    </div>
                                    <a
                                      href={`tel:${vendor.phone}`}
                                      className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 text-primary-600 shadow-lg shadow-gray-100/50 hover:bg-primary-600 hover:text-white transition-all transform active:scale-95"
                                      title="Call Vendor"
                                    >
                                      <Phone size={20} strokeWidth={2.5} />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
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
    </>
  )
}
