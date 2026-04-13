import { useEffect, useState, useRef, useMemo } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  ChevronRight,
  ChevronLeft,
  Activity,
  Info,
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Ticket,
  LayoutList,
  Headphones,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import Loader from '@/shared/components/Loader.jsx'
import TicketsModal from '@/customer/components/TicketsModal.jsx'
import { joinUploadUrl } from '@/shared/config/api.js'

const getFullUrl = (path) => (path ? joinUploadUrl(path) : null)

/** Agency label for customer booking: parent agency when booked by child/sub-child, else booking agent. */
function getAgencyDisplayName(booking) {
  const agent = booking?.bookedBy
  if (!agent) return null
  const parent = agent.parentRef
  if (parent && (agent.role === 'child_agent' || agent.role === 'sub_child_agent')) {
    return parent.contactPersonName?.trim() || parent.name || null
  }
  if (agent.role === 'parent_agent') {
    return agent.name || null
  }
  return parent?.name || agent.name || null
}

function statusChipClass(status) {
  const s = (status || 'confirmed').toLowerCase()
  if (s === 'completed') return 'bg-emerald-50 text-emerald-800 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/50'
  if (s === 'cancelled') return 'bg-red-50 text-red-800 ring-red-100 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/50'
  return 'bg-sky-50 text-sky-800 ring-sky-100 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900/50'
}

export default function Booking() {
  const { bookingId: paramBookingId } = useParams()
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
    return () => {
      isMounted = false
    }
  }, [paramBookingId])

  const pkg = booking?.package || {}
  const wlPkg = booking?.whitelabelPackage || {}
  const itinerary = pkg.itinerary || []
  const activeDay = itinerary[activeDayIdx] || null

  const allImages = useMemo(() => {
    const list = []
    const pkgImages = pkg.images || []
    const coverImg = pkg.coverImage
    if (coverImg) list.push(getFullUrl(coverImg))
    pkgImages.forEach((img) => {
      const url = getFullUrl(img)
      if (url && !list.includes(url)) list.push(url)
    })
    return list
  }, [pkg.coverImage, pkg.images])

  useEffect(() => {
    if (allImages.length > 1) {
      if (carouselTimer.current) clearInterval(carouselTimer.current)
      carouselTimer.current = setInterval(() => {
        setCurrentImgIdx((prev) => (prev + 1) % allImages.length)
      }, 6000)
    }
    return () => clearInterval(carouselTimer.current)
  }, [allImages.length])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader size="lg" text="Loading your trip…" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white px-6 py-14 text-center shadow-sm dark:border-white/10 dark:bg-gray-950">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
          <Info className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">No active trip</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          When you have a booking, your itinerary and day-by-day plan will appear here.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/customer/home"
            className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Browse trips
          </Link>
          <Link
            to="/customer/trip-history"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/5"
          >
            Trip history
          </Link>
        </div>
      </div>
    )
  }

  const prevImage = () => setCurrentImgIdx((prev) => (prev - 1 + allImages.length) % allImages.length)
  const nextImage = () => setCurrentImgIdx((prev) => (prev + 1) % allImages.length)

  const travelDateFormatted = new Date(booking.travelDate).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const statusLabel = (booking.bookingStatus || 'confirmed').replace(/_/g, ' ')
  const agencyName = getAgencyDisplayName(booking)
  const agencyContactTitle = agencyName || booking.bookedBy?.name || ''
  const showAgentSubline =
    Boolean(agencyName && booking.bookedBy?.name && booking.bookedBy.name !== agencyName)

  return (
    <>
      <div className="animate-fade-in space-y-6 pb-24 sm:space-y-8">
        <style
          dangerouslySetInnerHTML={{
            __html: `
        .scrollbar-trip::-webkit-scrollbar { height: 6px; }
        .scrollbar-trip::-webkit-scrollbar-thumb { background: rgb(209 213 219); border-radius: 9999px; }
        .scrollbar-trip { scrollbar-width: thin; scrollbar-color: rgb(209 213 219) transparent; }
      `,
          }}
        />

        {/* Page intro */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Trips</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {wlPkg.customTitle || pkg.title || 'Your trip'}
            </h1>
            {pkg.destination ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                {pkg.destination}
              </p>
            ) : null}
          </div>
          <Link
            to="/customer/trip-history"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <LayoutList className="h-4 w-4" strokeWidth={2} />
            All trips
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        {/* Hero + trip summary: mobile = same stacked blocks as before; desktop = 6+6 grid */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-6 xl:gap-8">
          {/* Image — col1–6 */}
          <div className="min-w-0 lg:col-span-6 lg:flex lg:flex-col">
            <div className="group relative isolate h-full w-full overflow-hidden rounded-2xl border border-gray-200/80 bg-gray-900 shadow-sm dark:border-white/10 sm:rounded-3xl lg:min-h-[320px]">
              <div className="relative aspect-[21/9] min-h-[200px] w-full sm:min-h-[280px] lg:absolute lg:inset-0 lg:aspect-auto lg:min-h-0">
                {allImages.length > 0 ? (
                  <>
                    {allImages.map((img, idx) => (
                      <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                          idx === currentImgIdx ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
                    {allImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prevImage}
                          aria-label="Previous photo"
                          className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-4 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={nextImage}
                          aria-label="Next photo"
                          className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-4 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <ChevronRight className="h-5 w-5" strokeWidth={2} />
                        </button>
                        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                          {allImages.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCurrentImgIdx(idx)}
                              aria-label={`Photo ${idx + 1}`}
                              className={`h-1 rounded-full transition-all duration-300 ${
                                idx === currentImgIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-gradient-to-br from-primary-700 to-primary-900">
                    <span className="text-sm font-medium tracking-wide text-white/40">Trip preview</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trip summary — col 7–12; stacked rows on desktop so 50% width stays readable */}
          <div className="min-w-0 lg:col-span-6 lg:flex lg:flex-col">
            <div className="grid h-full gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-950 sm:grid-cols-2 sm:p-5 lg:flex lg:flex-col lg:gap-4 lg:p-6">
              <div className="flex gap-3 border-b border-gray-100 pb-3 sm:border-b-0 sm:pb-0 dark:border-white/5 lg:border-b lg:border-gray-100 lg:pb-4 dark:lg:border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                  <Ticket className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Booking</p>
                  <p className="truncate font-medium text-gray-900 dark:text-white">{booking.bookingId}</p>
                </div>
              </div>
              <div className="flex gap-3 border-b border-gray-100 pb-3 sm:border-b-0 sm:pb-0 dark:border-white/5 lg:border-b lg:border-gray-100 lg:pb-4 dark:lg:border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                  <Calendar className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Travel date</p>
                  <p className="font-medium text-gray-900 dark:text-white">{travelDateFormatted}</p>
                </div>
              </div>
              <div className="flex gap-3 border-b border-gray-100 pb-3 sm:border-b-0 sm:pb-0 dark:border-white/5 lg:border-b lg:border-gray-100 lg:pb-4 dark:lg:border-white/10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                  <Info className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <span
                    className={`mt-0.5 inline-flex rounded-lg px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${statusChipClass(booking.bookingStatus)}`}
                  >
                    {statusLabel}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 lg:border-b-0 lg:pb-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                  <Headphones className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Agency contact</p>
                  {booking.bookedBy ? (
                    <div className="mt-0.5 space-y-1">
                      {agencyContactTitle ? (
                        <p className="font-medium leading-snug text-gray-900 dark:text-white">{agencyContactTitle}</p>
                      ) : null}
                      {showAgentSubline ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Agent: {booking.bookedBy.name}
                        </p>
                      ) : null}
                      <a
                        href={`tel:${booking.bookedBy.phone}`}
                        className="inline-flex font-medium text-primary-600 hover:underline dark:text-primary-400"
                      >
                        {booking.bookedBy.phone}
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Not available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Day nav + actions */}
        <div className="sticky top-[4.5rem] z-30 -mx-1 border-b border-gray-200/80 bg-gray-50/95 py-3 backdrop-blur-md dark:border-white/10 dark:bg-gray-900/95 sm:-mx-0 sm:rounded-2xl sm:border sm:px-4 sm:py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="scrollbar-trip flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {itinerary.length === 0 ? (
                <p className="py-2 text-sm text-gray-500 dark:text-gray-400">No itinerary days yet.</p>
              ) : (
                itinerary.map((day, idx) => {
                  const isActive = activeDayIdx === idx
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveDayIdx(idx)}
                      className={`shrink-0 rounded-xl border px-4 py-2.5 text-left transition ${
                        isActive
                          ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-white/20'
                      }`}
                    >
                      <span className="block text-[10px] font-medium uppercase tracking-wider opacity-80">Day</span>
                      <span className="text-lg font-semibold tabular-nums">{day.day}</span>
                    </button>
                  )
                })
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-200/80 pt-3 sm:border-t-0 sm:pt-0 dark:border-white/10">
              <Link
                to="/customer/community"
                state={{ selectedPackageId: booking.package?._id }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:flex-initial dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                title="Community"
                aria-label="Open trip community chat"
              >
                <MessageSquare className="h-4 w-4" strokeWidth={2} />
                <span className="hidden sm:inline">Chat</span>
              </Link>
              <Link
                to={`/customer/booking/${booking.bookingId}/reviews/${booking.package?._id}?readOnly=false&status=${booking.bookingStatus}&bookingId=${booking.bookingId}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:flex-initial dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                title={
                  String(booking.bookingStatus || '').toLowerCase() === 'cancelled'
                    ? 'View guest reviews (ratings are not available for cancelled trips)'
                    : 'Guest experience — rate from the first itinerary day (on or after that date); read reviews anytime'
                }
                aria-label="Guest experience: reviews and your rating"
              >
                <Star className="h-4 w-4 text-amber-500" strokeWidth={2} />
                <span className="hidden sm:inline">Review</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowTicketsModal(true)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:flex-initial dark:border-white/10 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                title="Tickets"
                aria-label="View travel tickets"
              >
                <Ticket className="h-4 w-4" strokeWidth={2} />
                <span className="hidden sm:inline">Tickets</span>
              </button>
            </div>
          </div>
        </div>

        {/* Day content */}
        {activeDay ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200/80 bg-white px-5 py-6 shadow-sm dark:border-white/10 dark:bg-gray-950 sm:px-8 sm:py-8">
              <p className="text-xs font-medium uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Day {activeDay.day}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                {activeDay.title}
              </h2>
              {activeDay.description ? (
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
                  {activeDay.description}
                </p>
              ) : null}
            </section>

            <div className="space-y-4 sm:space-y-5">
              {(activeDay.experiences || []).map((exp, eIdx) => {
                const vendor = exp.vendor || {}
                return (
                  <article
                    key={eIdx}
                    className="rounded-2xl border border-gray-200/80 bg-white shadow-sm transition hover:border-gray-300/80 dark:border-white/10 dark:bg-gray-950 dark:hover:border-white/15"
                  >
                    <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-8">
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5 lg:aspect-auto lg:h-48 lg:w-56 lg:shrink-0">
                        {exp.images?.[0] ? (
                          <img
                            src={getFullUrl(exp.images[0])}
                            alt={exp.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full min-h-[140px] flex-col items-center justify-center text-gray-400">
                            <Activity className="h-10 w-10" strokeWidth={1.25} />
                            <span className="mt-2 text-xs font-medium uppercase tracking-wider text-gray-400">Experience</span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                          <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-800 dark:bg-white/5 dark:text-gray-200">
                            <Clock className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" strokeWidth={2} />
                            <span>
                              {exp.startTime}
                              {exp.endTime ? ` — ${exp.endTime}` : ''}
                            </span>
                          </div>
                          {exp.category ? (
                            <span className="w-fit rounded-lg bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
                              {exp.category}
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white sm:text-xl">{exp.name}</h3>
                          {exp.description ? (
                            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{exp.description}</p>
                          ) : null}
                        </div>

                        {vendor.name ? (
                          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Vendor</p>
                              <p className="mt-0.5 font-medium text-gray-900 dark:text-white">{vendor.name}</p>
                            </div>
                            {vendor.phone ? (
                              <a
                                href={`tel:${vendor.phone}`}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-primary-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-gray-900 dark:hover:bg-white/5"
                              >
                                <Phone className="h-4 w-4" strokeWidth={2} />
                                Call
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        ) : itinerary.length > 0 ? (
          <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-sm text-gray-500 dark:border-white/10 dark:bg-gray-950 dark:text-gray-400">
            Select a day to view the plan
          </div>
        ) : null}

                {/* Included + Not included: mobile stacked; desktop6+6 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-6 xl:gap-8">
          <div className="min-w-0 lg:col-span-6">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-950">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-600/90 dark:text-emerald-400/90">Included</h3>
              <ul className="mt-4 max-h-48 space-y-2.5 overflow-y-auto pr-1 text-sm text-gray-600 dark:text-gray-300 lg:max-h-64">
                {pkg.inclusions?.length ? (
                  pkg.inclusions.map((item, idx) => (
                    <li key={idx} className="flex gap-2.5">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2} />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">None listed</li>
                )}
              </ul>
            </div>
          </div>
          <div className="min-w-0 lg:col-span-6">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-950">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-600/90 dark:text-rose-400/90">Not included</h3>
              <ul className="mt-4 max-h-48 space-y-2.5 overflow-y-auto pr-1 text-sm text-gray-600 dark:text-gray-300 lg:max-h-64">
                {pkg.exclusions?.length ? (
                  pkg.exclusions.map((item, idx) => (
                    <li key={idx} className="flex gap-2.5">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" strokeWidth={2} />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">None listed</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <TicketsModal isOpen={showTicketsModal} onClose={() => setShowTicketsModal(false)} tickets={booking.tickets} />
    </>
  )
}
