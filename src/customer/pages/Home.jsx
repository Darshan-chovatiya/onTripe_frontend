import { useEffect, useState } from 'react'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  ChevronRight, 
  Ticket, 
  Hotel, 
  Car, 
  Utensils, 
  Activity, 
  Info,
  ExternalLink,
  Home as HomeIcon,
  Search,
  History,
  LogOut
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import Loader from '@/shared/components/Loader.jsx'

/**
 * Maps event types to icons for better visual categorization.
 */
const getEventIcon = (type) => {
  switch (type) {
    case 'hotel_checkin':
    case 'hotel_checkout':
      return <Hotel className="h-5 w-5" />
    case 'transfer':
      return <Car className="h-5 w-5" />
    case 'meal':
      return <Utensils className="h-5 w-5" />
    case 'activity':
      return <Activity className="h-5 w-5" />
    default:
      return <Activity className="h-5 w-5" />
  }
}

/**
 * Returns a human-friendly label for the event type.
 */
const getEventLabel = (type) => {
  const map = {
    hotel_checkin: 'Hotel Check-in',
    hotel_checkout: 'Hotel Check-out',
    transfer: 'Transfer',
    meal: 'Meal',
    activity: 'Activity',
    other: 'General'
  }
  return map[type] || 'Event'
}

export default function Home() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeDayIdx, setActiveDayIdx] = useState(0)

  // Fetch booking details on mount
  useEffect(() => {
    let isMounted = true
    const fetchBookingDetails = async () => {
      // If we don't have a bookingId in the user context, we search for it.
      // After login it should be there.
      const bookingId = user?.bookingId
      if (!bookingId) {
        if (isMounted) setLoading(false)
        return
      }
      
      try {
        const { data } = await axiosInstance.get(`/customer/bookings/${bookingId}`)
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

    fetchBookingDetails()
    return () => { isMounted = false }
  }, [user?.bookingId])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader size="lg" text="Fetching your trip itinerary…" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="mb-6 rounded-full bg-primary-50 p-6 dark:bg-primary-900/30">
          <MapPin className="h-12 w-12 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900 font-inter dark:text-white">Welcome, {user?.name || 'Traveler'}!</h2>
        <p className="text-gray-600 mb-8 max-w-sm dark:text-gray-400">
          We couldn't find an active booking for you yet. Once a booking is assigned, your itinerary will appear here.
        </p>
        <div className="flex gap-4">
          <Link to="/customer/search" className="btn-primary">Find a Package</Link>
          <button onClick={handleLogout} className="btn-secondary flex items-center gap-2">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    )
  }

  const pkg = booking.package || {}
  const wlPkg = booking.whitelabelPackage || {}
  const itinerary = pkg.itinerary || wlPkg.originalPackage?.itinerary || []
  const activeDay = itinerary[activeDayIdx] || null

  return (
    <div className="space-y-8 animate-fade-in pb-12 pt-4">
      {/* Hero Content (Banner) */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 p-8 text-white shadow-2xl md:p-12">
        <div className="relative z-10">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
              Order ID: {booking.bookingId}
            </span>
            <span className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
              {pkg.totalDays} Days / {pkg.totalDays - 1} Nights
            </span>
          </div>
          <h1 className="max-w-2xl text-2xl font-extrabold tracking-tight sm:text-6xl leading-[1.2] md:leading-[1.1]">
            {pkg.title || 'Ongoing Adventure'}
          </h1>
          <div className="mt-8 flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary-200 uppercase tracking-tighter">Destination</p>
                <p className="text-lg font-bold">{pkg.destination || 'Global travel'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary-200 uppercase tracking-tighter">Guest</p>
                <p className="text-lg font-bold">{user?.name || 'Trip Traveler'}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Abstract Shapes for Premium Feel */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/5 blur-3xl opacity-50" />
        <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      {/* Modern Unified Rounded Box View for Day Navigation */}
      <div className="sticky top-0 z-30 -mx-4 bg-gray-50/90 py-6 px-4 backdrop-blur-2xl dark:bg-gray-900/90 border-b border-gray-100 dark:border-white/5">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-2">
          {itinerary.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setActiveDayIdx(idx)}
              className="group relative flex flex-col items-center shrink-0"
            >
              <div className={`flex flex-col items-center justify-center min-w-[80px] md:min-w-[120px] px-4 py-3 md:py-5 rounded-[1.5rem] md:rounded-[2rem] transition-all duration-500 active:scale-95 ${
                activeDayIdx === idx
                  ? 'bg-primary-600 text-white shadow-2xl shadow-primary-200 dark:shadow-none scale-105'
                  : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50 dark:bg-gray-800 dark:border-white/5 dark:hover:bg-white/10'
              }`}>
                <span className={`text-[8px] md:text-xs font-black uppercase tracking-[0.2em] mb-1 transition-colors ${activeDayIdx === idx ? 'text-primary-200' : 'text-gray-400'}`}>
                  DAY {idx + 1}
                </span>
                <span className={`text-xs md:text-lg font-black tracking-tight ${activeDayIdx === idx ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                  {day.dateSuffix ? day.dateSuffix.split(' ')[0] : `Day ${idx + 1}`}
                </span>
              </div>
              <div className={`mt-3 h-1.5 w-6 rounded-full transition-all duration-500 shadow-sm ${activeDayIdx === idx ? 'bg-primary-500 opacity-100 w-10' : 'bg-transparent opacity-0 w-0'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Day Content and Summary */}
      {activeDay ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Detailed Timeline */}
          <div className="space-y-6">
            <div className="rounded-[2rem] bg-white p-8 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                {activeDay.title || `Day ${activeDay.day} Highlights`}
              </h2>
              {activeDay.description && (
                <p className="text-lg text-gray-600 leading-relaxed dark:text-gray-400">
                  {activeDay.description}
                </p>
              )}
            </div>

            {/* Event List */}
            <div className="relative ml-6 border-l-2 border-primary-100 dark:border-gray-800 pl-10 space-y-12">
              {activeDay.events && activeDay.events.length > 0 ? (
                activeDay.events.map((event, eIdx) => (
                  <div key={eIdx} className="relative group">
                    <div className={`absolute -left-[58px] top-4 flex h-12 w-12 items-center justify-center rounded-full border-8 border-gray-50 bg-white shadow-md dark:border-gray-900 dark:bg-gray-800 transition-transform group-hover:scale-110 ${
                      activeDayIdx === 0 ? 'text-primary-600' : 'text-primary-500'
                    }`}>
                      {getEventIcon(event.type)}
                    </div>

                    <div className="rounded-[2rem] bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:bg-white/[0.03] dark:border-gray-800">
                      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3 py-1.5 px-4 rounded-full bg-primary-50 text-primary-700 font-bold text-sm dark:bg-primary-900/30 dark:text-primary-300">
                          <Clock size={16} />
                          <span>{event.startTime} {event.endTime ? `— ${event.endTime}` : ''}</span>
                        </div>
                        <span className={`text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full border ${
                          event.type === 'activity' ? 'border-emerald-200 text-emerald-600' : 
                          event.type.startsWith('hotel') ? 'border-primary-200 text-primary-600' : 'border-gray-200 text-gray-500'
                        }`}>
                          {getEventLabel(event.type)}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-gray-900 mb-3 dark:text-white">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-gray-600 leading-relaxed dark:text-gray-400">
                          {event.description}
                        </p>
                      )}

                      {/* Pickup & Vehicle Info */}
                      {event.pickupDetails && (event.pickupDetails.driverName || event.pickupDetails.vehicleNumber) && (
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-3xl bg-gray-50 p-6 dark:bg-gray-900/40">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Assigned Driver</p>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                <User size={20} />
                              </div>
                              <span className="font-bold text-gray-800 dark:text-gray-200">{event.pickupDetails.driverName || 'Verified Driver'}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Transport</p>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Car size={20} />
                              </div>
                              <span className="font-black text-gray-800 dark:text-gray-200">{event.pickupDetails.vehicleNumber || 'Vehicle Assigned'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Attached Documents */}
                      {event.tickets && event.tickets.length > 0 && (
                        <div className="mt-8 flex flex-wrap gap-3">
                          {event.tickets.map((t, idx) => (
                            <a 
                              key={idx} 
                              href={t.fileUrl} 
                              target="_blank" 
                              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-50 hover:border-primary-500 transition-all shadow-sm"
                            >
                              <Ticket size={18} className="text-primary-500" />
                              {t.name || 'Get Voucher'}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <p className="text-gray-400 text-lg italic">Relaxing day - nothing scheduled yet!</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Info Section */}
          <div className="space-y-8">
            {/* Vendor List for the day */}
            {activeDay.events?.some(e => e.vendor) && (
              <div className="rounded-[2.5rem] bg-white p-8 shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.2em] mb-8">Trip Support</h3>
                <div className="space-y-6">
                  {activeDay.events.filter(e => e.vendor).map((e, idx) => (
                    <div key={idx} className="group p-6 rounded-3xl bg-gray-50/50 hover:bg-primary-50/50 transition-colors dark:bg-gray-900/50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{getEventLabel(e.type)}</span>
                        <div className="p-2 rounded-xl bg-white shadow-sm">
                          <User size={14} className="text-gray-400" />
                        </div>
                      </div>
                      <h4 className="text-lg font-black text-gray-900 dark:text-white mb-1">{e.vendor.name}</h4>
                      <div className="flex items-center justify-between mt-4">
                         <div className="text-sm text-gray-500">Contact: {e.vendor.contactPerson}</div>
                         {e.vendor.phone && (
                           <a href={`tel:${e.vendor.phone}`} className="h-10 w-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:shadow-emerald-200 hover:scale-110 active:scale-95 transition-all">
                             <Phone size={18} />
                           </a>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Voucher Link */}
            <div className="rounded-[2.5rem] bg-indigo-900 p-8 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                 <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                   <Ticket className="text-indigo-400" /> My Tickets
                 </h3>
                 <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
                   Access all your booking vouchers, flight details, and entry tickets in one centralized place.
                 </p>
                 <button className="w-full py-4 bg-white text-indigo-900 font-black rounded-3xl shadow-xl hover:bg-gray-100 active:scale-95 transition-all">
                   Manage Documents
                 </button>
               </div>
               <Activity className="absolute -right-8 -bottom-8 h-32 w-32 text-white/5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-96 items-center justify-center rounded-[3rem] border-4 border-dashed border-gray-100 text-gray-300">
          Trip itinerary initialization...
        </div>
      )}
    </div>
  )
}
