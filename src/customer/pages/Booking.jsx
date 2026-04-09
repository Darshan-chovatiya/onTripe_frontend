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
  Star
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import Loader from '@/shared/components/Loader.jsx'
import CommunityChat from '../components/CommunityChat.jsx'
import ReviewSection from '../components/ReviewSection.jsx'

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
  const [activeTab, setActiveTab] = useState('itinerary') // 'itinerary' or 'community'
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

  const handleLogout = () => {
    logout()
    navigate('/customer/login', { replace: true })
  }

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
        <button onClick={handleLogout} className="btn-secondary flex items-center gap-2">
           <LogOut size={18} /> Logout
        </button>
      </div>
    )
  }

  const prevImage = () => setCurrentImgIdx(prev => (prev - 1 + allImages.length) % allImages.length)
  const nextImage = () => setCurrentImgIdx(prev => (prev + 1) % allImages.length)

  return (
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
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 bg-primary-600/20 backdrop-blur-md rounded-full border border-primary-500/30">
             <Calendar size={14} className="text-primary-400" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">{new Date(booking.travelDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <h1 className="max-w-4xl text-3xl font-black tracking-tight md:text-7xl drop-shadow-2xl leading-[1.1]">
            {wlPkg.customTitle || pkg.title || 'Your Journey'}
          </h1>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <p className="flex items-center gap-2.5 font-black text-white px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5">
              <MapPin className="h-5 w-5 text-primary-400" />
              <span className="uppercase tracking-[0.2em] text-[10px] md:text-xs">{pkg.destination}</span>
            </p>
            <p className="flex items-center gap-2.5 font-black text-white px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5">
              <span className="uppercase tracking-[0.2em] text-[10px] md:text-xs">₹{booking.totalAmount.toLocaleString()}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Experience Selector (Tabs) */}
      <div className="sticky top-4 z-50 px-4">
         <div className="max-w-2xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl p-1.5 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-white/5 flex gap-2">
            <button 
              onClick={() => setActiveTab('itinerary')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-500 ${activeTab === 'itinerary' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
               <Calendar size={16} /> Itinerary
            </button>
            <button 
              onClick={() => setActiveTab('community')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-500 ${activeTab === 'community' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
               <MessageSquare size={16} /> Community
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-500 ${activeTab === 'reviews' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
            >
               <Star size={16} /> Reviews
            </button>
         </div>
      </div>

      {activeTab === 'itinerary' ? (
        <>
          {/* Day Navigation */}
          <div className="px-4">
            <div className="flex gap-4 md:gap-8 overflow-x-auto justify-center py-4 scroll-smooth scrollbar-hide px-4 snap-x snap-mandatory">
              {itinerary.map((day, idx) => {
                const isActive = activeDayIdx === idx
                return (
                  <button key={idx} onClick={() => setActiveDayIdx(idx)} className="group relative flex flex-col items-center shrink-0 snap-center outline-none">
                    <div className={`flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl border transition-all duration-500 ${isActive ? 'bg-primary-600 border-primary-600 text-white scale-110 shadow-xl shadow-primary-200' : 'bg-white border-gray-100 text-gray-500 hover:border-primary-200'}`}>
                      <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? 'text-primary-100' : 'text-gray-400'}`}>Day</span>
                      <span className="text-2xl md:text-3xl font-black">{day.day}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Day Content */}
          {activeDay ? (
            <div className="w-full space-y-10 px-4">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Title Card */}
                <div className="md:col-span-2 rounded-[2.5rem] bg-white dark:bg-gray-800 p-8 md:p-12 shadow-2xl shadow-gray-100/50 border border-gray-50 dark:border-white/5 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-50 dark:bg-primary-900/10 rounded-full" />
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">{activeDay.title}</h2>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{activeDay.description || 'Discover new stories today.'}</p>
                </div>
                {/* Meals Summary */}
                <div className="rounded-[2.5rem] bg-primary-600 p-8 md:p-10 shadow-2xl shadow-primary-200 text-white flex flex-col justify-between overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:scale-125 transition-all duration-700"><Utensils size={120} /></div>
                  <h3 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                      <span className="p-2 bg-white/20 rounded-xl"><Utensils size={18} /></span> Daily Meals
                  </h3>
                  <div className="space-y-6">
                      {[{l:'Breakfast',a:activeDay.meals?.breakfast},{l:'Lunch',a:activeDay.meals?.lunch},{l:'Dinner',a:activeDay.meals?.dinner}].map((m,i)=>(
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm font-black uppercase tracking-widest">{m.l}</span>
                          <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${m.a ? 'bg-white/30 border-white/20 shadow-sm' : 'bg-black/20 border-white/5 opacity-50'}`}>{m.a ? 'Included' : 'On Your Own'}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Experiences List */}
              <div className="space-y-6 md:pl-10 md:border-l-2 border-gray-100 dark:border-white/5">
                {(activeDay.experiences || []).map((exp, eIdx) => {
                  const vendor = exp.vendor || {}
                  return (
                    <div key={eIdx} className="relative group">
                      <div className="absolute -left-[54px] top-8 hidden md:flex w-11 items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-600 shadow-[0_0_15px_rgba(37,99,235,0.5)] ring-8 ring-primary-50 dark:ring-primary-950" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 md:p-8 shadow-xl shadow-gray-100/50 border border-gray-100 dark:border-white/5 transition-all hover:translate-x-2">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="w-full md:w-64 h-48 md:h-auto shrink-0 rounded-3xl overflow-hidden shadow-inner bg-gray-50 dark:bg-white/5 flex items-center justify-center relative">
                              {exp.images?.[0] ? <img src={getFullUrl(exp.images[0])} alt={exp.name} className="absolute inset-0 h-full w-full object-cover" /> : <Activity size={32} className="text-gray-200" />}
                            </div>
                            <div className="flex-1 space-y-6">
                              <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 px-5 py-2.5 rounded-2xl border border-gray-100">
                                    <Clock size={16} className="text-primary-500" />
                                    <span className="text-[11px] md:text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">{exp.startTime} {exp.endTime && <span className="mx-2 opacity-20">—</span>} {exp.endTime}</span>
                                </div>
                                <span className="px-5 py-2.5 rounded-2xl bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{exp.category}</span>
                              </div>
                              <div>
                                <h3 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-4">{exp.name}</h3>
                                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{exp.description}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-50 dark:border-white/5">
                                {exp.location && <div className="flex items-center gap-3 text-gray-400"><MapPin size={18} /><span className="text-xs font-black uppercase tracking-wider underline underline-offset-8">Explore Location</span></div>}
                                {vendor.name && (
                                  <div className="ml-auto flex items-center gap-4">
                                      <div className="text-right hidden sm:block">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Primary Contact</p>
                                        <p className="text-sm font-black text-gray-900 dark:text-white">{vendor.name}</p>
                                      </div>
                                      <a href={`tel:${vendor.phone}`} className="p-4 rounded-2xl bg-white border border-gray-200 text-primary-600 shadow-lg shadow-gray-100/50 hover:bg-primary-600 hover:text-white transition-all transform active:scale-95"><Phone size={20} strokeWidth={2.5} /></a>
                                  </div>
                                )}
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
          )}
        </>
      ) : activeTab === 'community' ? (
        <div className="px-4">
           {booking.package?._id ? (
             <CommunityChat packageId={booking.package._id} customerId={booking.customer?._id} />
           ) : (
             <div className="text-center p-20 opacity-40 uppercase font-black text-xs tracking-widest">Community Unavailable</div>
           )}
        </div>
      ) : (
        <ReviewSection
          bookingId={booking.bookingId}
          packageId={booking.package?._id}
          bookingStatus={booking.bookingStatus}
        />
      )}
    </div>
  )
}
