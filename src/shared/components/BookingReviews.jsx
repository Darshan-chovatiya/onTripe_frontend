import { useEffect, useRef, useState, useCallback } from 'react'
import { Star, Edit2, Trash2, MessageSquare, Calendar, ChevronLeft, ChevronRight, Eye, EyeOff, Info, AlertCircle } from 'lucide-react'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useAuth } from '@/shared/context/AuthContext'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Modal from '@/shared/components/Modal.jsx'
import Loader from '@/shared/components/Loader.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'

const PAGE_SIZE = 5

function normalizeBookingStatus(s) {
    return String(s ?? '').toLowerCase().trim()
}

function formatScheduleDateDisplay(iso) {
    if (!iso) return null
    try {
        const d = new Date(iso)
        if (Number.isNaN(d.getTime())) return null
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
        return null
    }
}

// Star rating input component
function StarInput({ value, onChange, label }) {
    const [hovered, setHovered] = useState(0)
    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500">{label}</p>
            <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="transition-transform active:scale-90"
                    >
                        <Star
                            size={28}
                            className={`transition-colors ${(hovered || value) >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-200'
                                }`}
                        />
                    </button>
                ))}
            </div>
        </div>
    )
}

// Display stars (read-only)
function StarDisplay({ value, size = 14, showLabel = false }) {
    const num = Number(value) || 0
    return (
        <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={size}
                        className={num >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                    />
                ))}
            </div>
            {showLabel && num > 0 && (
                <span className="text-xs font-bold text-amber-600 ml-1">{num.toFixed(1)}</span>
            )}
        </div>
    )
}

// Read More helper component
function ReadMore({ text, limit = 200 }) {
    const [expanded, setExpanded] = useState(false)
    if (!text) return null
    if (text.length <= limit) return <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600 dark:text-gray-300">{text}</p>

    return (
        <div className="space-y-1">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {expanded ? text : `${text.substring(0, limit)}...`}
            </p>
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-[10px] font-semibold uppercase tracking-wider text-primary-600 hover:text-primary-700"
            >
                {expanded ? 'Show Less' : 'Read More'}
            </button>
        </div>
    )
}

/**
 * BookingReviews
 * @param {string} packageId  — required
 * @param {string} bookingId  — required for write mode
 * @param {string} bookingStatus
 * @param {boolean} readOnly  — if true, only shows reviews, no submit
 * @param {string} reviewsApiEndpoint — override the GET endpoint for reviews (for admin)
 */
export default function BookingReviews({
    bookingId,
    packageId,
    bookingStatus,
    readOnly = false,
    reviewsApiEndpoint,
    variant = 'default',
}) {
    const isCustomerVariant = variant === 'customer'
    const { toast } = useToast()
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

    const needsEligibility = isCustomerVariant && !readOnly && Boolean(bookingId)
    const [eligibilityLoading, setEligibilityLoading] = useState(needsEligibility)
    const [liveBookingStatus, setLiveBookingStatus] = useState(null)
    const [eligibilityErr, setEligibilityErr] = useState(null)
    const [pkgMismatch, setPkgMismatch] = useState(false)
    const [reviewWindowOpen, setReviewWindowOpen] = useState(false)
    const [scheduleDateIso, setScheduleDateIso] = useState(null)
    const [scheduleSource, setScheduleSource] = useState(null)

    // ── Summary stats ──────────────────────────────────────────────
    const [avgOverallRating, setAvgOverallRating] = useState(0)
    const [totalReviews, setTotalReviews] = useState(0)

    // ── All reviews + pagination ───────────────────────────────────
    const [allReviews, setAllReviews] = useState([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [reviewsLoading, setReviewsLoading] = useState(false)

    // ── My review (write mode) ─────────────────────────────────────
    const [myReview, setMyReview] = useState(null)
    const [myReviewLoading, setMyReviewLoading] = useState(() => !readOnly && Boolean(bookingId))
    const [summaryLoading, setSummaryLoading] = useState(true)

    // ── Modal state ────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [form, setForm] = useState({ rating: 0, comment: '' })

    // ── Visibility Toggling ────────────────────────────────────────
    const [confirmVisibility, setConfirmVisibility] = useState({ open: false, reviewId: null, currentlyVisible: true })

    useEffect(() => {
        if (!needsEligibility) {
            setEligibilityLoading(false)
            setLiveBookingStatus(null)
            setEligibilityErr(null)
            setPkgMismatch(false)
            setReviewWindowOpen(false)
            setScheduleDateIso(null)
            setScheduleSource(null)
            return
        }
        let cancelled = false
        setEligibilityLoading(true)
        setEligibilityErr(null)
        setPkgMismatch(false)
        ;(async () => {
            try {
                const res = await axiosInstance.get(`/customer/bookings/${bookingId}/review-eligibility`)
                if (cancelled) return
                if (res.data?.success && res.data.data) {
                    const d = res.data.data
                    setLiveBookingStatus(d.bookingStatus)
                    setPkgMismatch(Boolean(packageId && d.packageId && String(d.packageId) !== String(packageId)))
                    setReviewWindowOpen(Boolean(d.reviewWindowOpen))
                    setScheduleDateIso(d.scheduleDate || null)
                    setScheduleSource(d.scheduleSource ?? null)
                } else {
                    setLiveBookingStatus(null)
                    setReviewWindowOpen(false)
                    setScheduleDateIso(null)
                    setScheduleSource(null)
                    setEligibilityErr(res.data?.message || 'Could not load trip status')
                }
            } catch (e) {
                if (cancelled) return
                setLiveBookingStatus(null)
                setReviewWindowOpen(false)
                setScheduleDateIso(null)
                setScheduleSource(null)
                setEligibilityErr(e?.response?.data?.message || 'Could not verify your trip. Try again from your booking.')
            } finally {
                if (!cancelled) setEligibilityLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [needsEligibility, bookingId, packageId])

    const normalizedPropStatus = normalizeBookingStatus(bookingStatus)
    const effectiveStatus = needsEligibility
        ? eligibilityErr || eligibilityLoading
            ? null
            : normalizeBookingStatus(liveBookingStatus)
        : normalizedPropStatus

    const canReview =
        !readOnly &&
        Boolean(bookingId) &&
        !eligibilityErr &&
        !pkgMismatch &&
        (needsEligibility
            ? reviewWindowOpen
            : Boolean(effectiveStatus) && ['ongoing', 'completed'].includes(effectiveStatus))

    const showFullLoader =
        summaryLoading ||
        (needsEligibility && eligibilityLoading) ||
        (!readOnly && Boolean(bookingId) && myReviewLoading)

    // ── Resolve which endpoint to use ──────────────────────────────
    // Admin passes reviewsApiEndpoint = '/admin/reviews?packageId=xxx'
    // Everyone else uses '/customer/packages/:id/reviews'
    const getReviewsUrl = useCallback((pg) => {
        const base = reviewsApiEndpoint
            || `/customer/packages/${packageId}/reviews`
        const sep = base.includes('?') ? '&' : '?'
        return `${base}${sep}page=${pg}&limit=${PAGE_SIZE}`
    }, [reviewsApiEndpoint, packageId])

    // ── Fetch summary (first page stats) ──────────────────────────
    const fetchSummary = useCallback(async () => {
        if (!packageId && !reviewsApiEndpoint) return
        setSummaryLoading(true)
        try {
            const url = reviewsApiEndpoint
                ? `${reviewsApiEndpoint}${reviewsApiEndpoint.includes('?') ? '&' : '?'}page=1&limit=1`
                : `/customer/packages/${packageId}/reviews?page=1&limit=1`
            const res = await axiosInstance.get(url)
            if (res.data?.success) {
                const d = res.data.data
                setAvgOverallRating(Number(d.avgOverallRating || 0))
                setTotalReviews(Number(d.total || 0))
                setTotalPages(Math.ceil(Number(d.total || 0) / PAGE_SIZE) || 1)
            }
        } catch {
            // silent — admin token might work differently
        } finally {
            setSummaryLoading(false)
        }
    }, [packageId, reviewsApiEndpoint])

    // ── Fetch paginated reviews ────────────────────────────────────
    const fetchPage = useCallback(async (pg) => {
        if (!packageId && !reviewsApiEndpoint) return
        setReviewsLoading(true)
        try {
            const res = await axiosInstance.get(getReviewsUrl(pg))
            if (res.data?.success) {
                const d = res.data.data
                const reviews = d.reviews || []
                setAllReviews(reviews)
                setAvgOverallRating(Number(d.avgOverallRating || 0))
                setTotalReviews(Number(d.total || 0))
                setTotalPages(Math.ceil(Number(d.total || 0) / PAGE_SIZE) || 1)
            }
        } catch {
            // silent
        } finally {
            setReviewsLoading(false)
        }
    }, [getReviewsUrl, packageId, reviewsApiEndpoint])

    // ── Fetch my review (write mode) ───────────────────────────────
    const fetchMyReview = useCallback(async () => {
        if (readOnly || !bookingId) {
            setMyReview(null)
            setMyReviewLoading(false)
            return
        }
        setMyReviewLoading(true)
        try {
            const res = await axiosInstance.get(`/customer/bookings/${bookingId}/review`)
            if (res.data?.success) setMyReview(res.data.data.review)
            else setMyReview(null)
        } catch {
            setMyReview(null)
        } finally {
            setMyReviewLoading(false)
        }
    }, [readOnly, bookingId])

    // ── Init ───────────────────────────────────────────────────────
    useEffect(() => {
        setPage(1)
        fetchSummary()
        fetchPage(1)
        fetchMyReview()
    }, [packageId, bookingId, reviewsApiEndpoint])

    // ── Page change ────────────────────────────────────────────────
    const handlePageChange = (newPage) => {
        setPage(newPage)
        fetchPage(newPage)
    }

    // ── Review submit ──────────────────────────────────────────────
    const openAddModal = () => {
        setIsEditing(false)
        setForm({ rating: 0, comment: '' })
        setModalOpen(true)
    }
    const openEditModal = () => {
        setIsEditing(true)
        setForm({
            rating: myReview.overallRating,
            comment: myReview.comment || ''
        })
        setModalOpen(true)
    }

    const handleSubmit = async () => {
        if (!form.rating) {
            toast.error('Please give a rating')
            return
        }

        // Word count validation (500 words)
        const wordCount = form.comment.trim() ? form.comment.trim().split(/\s+/).length : 0
        if (wordCount > 500) {
            toast.error('Review cannot exceed 500 words')
            return
        }

        setSubmitting(true)
        // Save same value to both fields for backend compatibility
        const payload = { packageRating: form.rating, overallRating: form.rating, comment: form.comment }
        try {
            if (isEditing) {
                await axiosInstance.patch(`/customer/bookings/${bookingId}/review`, payload)
                toast.success('Review updated')
            } else {
                await axiosInstance.post(`/customer/bookings/${bookingId}/review`, payload)
                toast.success('Review submitted')
            }
            setModalOpen(false)
            fetchMyReview()
            fetchPage(1)
            setPage(1)
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Delete your review?')) return
        try {
            await axiosInstance.delete(`/customer/bookings/${bookingId}/review`)
            toast.success('Review deleted')
            setMyReview(null)
            fetchPage(page)
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to delete review')
        }
    }

    const handleToggleVisibility = async () => {
        const { reviewId, currentlyVisible } = confirmVisibility
        setConfirmVisibility({ ...confirmVisibility, open: false })

        try {
            const res = await axiosInstance.patch(`/admin/reviews/${reviewId}/visibility`)
            if (res.data?.success) {
                const updated = res.data.data.review
                setAllReviews(prev => prev.map(r => r._id === reviewId ? { ...r, isVisible: updated.isVisible } : r))
                toast.success(`Review is now ${updated.isVisible ? 'publicly visible' : 'hidden from guests'}`)
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to toggle visibility')
        }
    }

    if (showFullLoader) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader size="lg" />
                <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
                    {needsEligibility && eligibilityLoading
                        ? 'Loading your trip and reviews…'
                        : myReviewLoading
                          ? 'Loading your review…'
                          : 'Loading reviews…'}
                </p>
            </div>
        )
    }

    const visibleReviews = allReviews.filter(r => r._id !== myReview?._id)

    const listMaxH = isCustomerVariant ? 'max-h-[min(60vh,36rem)]' : 'max-h-[55vh]'

    return (
        <div className="grid min-h-0 grid-cols-1 gap-0 md:grid-cols-[minmax(0,240px)_1fr] lg:grid-cols-[minmax(0,260px)_1fr]">

            {/* ── LEFT: Stats + My Review ────────────────────────── */}
            <div className="mb-6 space-y-5 border-b border-gray-100 pb-6 md:sticky md:top-0 md:mb-0 md:h-fit md:border-b-0 md:border-r md:pr-6 md:pb-0 dark:border-white/10">

                {/* Summary Stats Cards */}
                <div className="space-y-3">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Review summary</h4>

                    {/* Score Card */}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Experience score</p>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-semibold tabular-nums text-gray-900 dark:text-white">{avgOverallRating.toFixed(1)}</span>
                            <StarDisplay value={Math.round(avgOverallRating)} size={16} />
                        </div>
                    </div>

                    {/* Count Card */}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Total feedback</p>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">{totalReviews}</span>
                            <div className="rounded-xl border border-gray-100 bg-white p-2 dark:border-white/10 dark:bg-gray-900">
                                <MessageSquare size={16} className="text-primary-600 dark:text-primary-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer guidance & errors */}
                {!readOnly && isCustomerVariant && pkgMismatch ? (
                    <div className="flex gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 text-sm text-amber-950 dark:border-amber-900/45 dark:bg-amber-950/35 dark:text-amber-100">
                        <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                        <p>
                            This page doesn&apos;t match your booking&apos;s package. Go back to{' '}
                            <span className="font-medium">Trips</span>, open your booking, and tap <span className="font-medium">Review</span>{' '}
                            again so your experience score is saved to the right trip.
                        </p>
                    </div>
                ) : null}

                {!readOnly && isCustomerVariant && eligibilityErr ? (
                    <div className="flex gap-3 rounded-2xl border border-red-200/90 bg-red-50/90 p-4 text-sm text-red-950 dark:border-red-900/45 dark:bg-red-950/35 dark:text-red-100">
                        <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                        <p>{eligibilityErr}</p>
                    </div>
                ) : null}

                {!readOnly && isCustomerVariant && !bookingId ? (
                    <div className="flex gap-3 rounded-2xl border border-gray-200 bg-gray-50/90 p-4 text-sm text-gray-700 dark:border-white/10 dark:bg-gray-900/40 dark:text-gray-200">
                        <Info className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" strokeWidth={2} aria-hidden />
                        <p>
                            Your experience score is tied to a specific booking. Open <span className="font-medium">Guest experience</span>{' '}
                            from <span className="font-medium">Trips</span> → your trip → <span className="font-medium">Review</span> to add
                            or edit a rating.
                        </p>
                    </div>
                ) : null}

                {!readOnly &&
                bookingId &&
                !myReview &&
                !pkgMismatch &&
                !eligibilityErr &&
                needsEligibility &&
                !reviewWindowOpen &&
                effectiveStatus !== 'cancelled' ? (
                    <div className="flex gap-3 rounded-2xl border border-sky-200/80 bg-sky-50/80 p-4 text-sm text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-100">
                        <Info className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" strokeWidth={2} aria-hidden />
                        <div className="space-y-1">
                            <p className="font-medium">Reviews open from the first day on your itinerary</p>
                            <p className="text-sky-900/90 dark:text-sky-100/90">
                                {scheduleDateIso ? (
                                    <>
                                        You can add your experience score on or after{' '}
                                        <span className="font-medium">{formatScheduleDateDisplay(scheduleDateIso)}</span>
                                        {scheduleSource === 'itinerary'
                                            ? ' (the date on day 1 of your itinerary).'
                                            : scheduleSource === 'travelDate'
                                              ? ' (your trip travel date — day 1 has no date on the itinerary).'
                                              : '.'}
                                    </>
                                ) : (
                                    <>
                                        We couldn&apos;t find a date on day 1 of your itinerary or a travel date for this
                                        booking. Add a date in the agency app or contact your agency; then you can rate
                                        here from that day onward.
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                ) : null}

                {!readOnly && bookingId && !myReview && !pkgMismatch && !eligibilityErr && effectiveStatus === 'cancelled' ? (
                    <div className="flex gap-3 rounded-2xl border border-gray-200 bg-gray-50/90 p-4 text-sm text-gray-700 dark:border-white/10 dark:bg-gray-900/40 dark:text-gray-200">
                        <Info className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" strokeWidth={2} aria-hidden />
                        <p>
                            This trip was <span className="font-medium">cancelled</span>, so experience ratings aren&apos;t available. You can still read feedback from other guests below.
                        </p>
                    </div>
                ) : null}

                {/* Write review CTA */}
                {!readOnly && canReview && !myReview && (
                    <div className="space-y-3 rounded-2xl border border-primary-100 bg-primary-50/60 p-4 text-center dark:border-primary-900/40 dark:bg-primary-950/25">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Share your experience</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Rate your trip from 1 to 5 stars. Optional short comment — you can edit or remove your review later.
                        </p>
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                        >
                            Add your experience score
                        </button>
                    </div>
                )}

                {/* My Review */}
                {!readOnly && myReview && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Your review</h4>
                        {isCustomerVariant ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Your score is included in this package&apos;s guest experience average when your review is visible to others.
                            </p>
                        ) : null}
                        <div className="rounded-2xl border border-primary-100 bg-primary-50/40 p-4 dark:border-primary-900/35 dark:bg-primary-950/20">
                            <div className="mb-3 flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Your rating</p>
                                    <StarDisplay value={myReview.overallRating} size={14} showLabel />
                                </div>
                                <div className="flex gap-1">
                                    <button type="button" onClick={openEditModal} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-primary-600 dark:hover:bg-white/10">
                                        <Edit2 size={13} />
                                    </button>
                                    <button type="button" onClick={handleDelete} className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-red-600 dark:hover:bg-white/10">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                            {myReview.comment && (
                                <div className="mt-3">
                                    <ReadMore text={myReview.comment} limit={150} />
                                </div>
                            )}
                            <p className="mt-3 flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                                <Calendar size={9} /> {new Date(myReview.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── RIGHT: Paginated Reviews ─────────────────────────── */}
            <div className="flex min-h-0 flex-col gap-4 md:pl-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Guest feedback {totalReviews > 0 && <span className="normal-case text-gray-300 dark:text-gray-600">({totalReviews})</span>}
                    </h4>
                    {totalReviews === 0 && !reviewsLoading && (
                        <span className="text-xs text-gray-400">No reviews yet</span>
                    )}
                </div>

                {/* Review Cards */}
                <div className={`flex-1 space-y-3 overflow-y-auto pr-1 ${listMaxH}`} style={{ scrollbarWidth: 'thin' }}>
                    {reviewsLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader size="md" />
                        </div>
                    ) : visibleReviews.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                            <MessageSquare className="mx-auto mb-2 opacity-20" size={28} />
                            <p className="text-sm">No reviews yet.</p>
                        </div>
                    ) : (
                        visibleReviews.map((r) => (
                            <div
                                key={r._id}
                                className={`group relative rounded-2xl border p-4 transition-all ${!r.isVisible
                                        ? 'border-red-100 bg-red-50/30 shadow-inner dark:border-red-900/40 dark:bg-red-950/20'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm dark:border-white/10 dark:bg-gray-950/50 dark:hover:border-white/15'
                                    }`}
                            >
                                {/* Header */}
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 text-sm font-semibold text-primary-700 dark:from-primary-900/50 dark:to-indigo-900/50 dark:text-primary-300">
                                            {(r.customer?.name || 'G')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">{r.customer?.name || 'Guest'}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div className="flex flex-col items-end gap-1.5">
                                            <StarDisplay value={r.overallRating} size={11} />
                                            {isAdmin && (
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {!r.isVisible && (
                                                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold text-[8px] uppercase tracking-wider">Hidden</span>
                                                    )}
                                                    <button
                                                        onClick={() => setConfirmVisibility({ open: true, reviewId: r._id, currentlyVisible: r.isVisible })}
                                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${r.isVisible
                                                                ? 'text-gray-400 border-gray-100 hover:text-red-500 hover:border-red-200 hover:bg-white'
                                                                : 'text-emerald-600 border-emerald-100 bg-emerald-50 hover:bg-emerald-100'
                                                            }`}
                                                    >
                                                        {r.isVisible ? (
                                                            <>
                                                                <EyeOff size={12} />
                                                                Hide
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye size={12} />
                                                                Publish
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {r.comment && (
                                    <div className="mt-1">
                                        <ReadMore text={r.comment} limit={200} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/10">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Page <span className="font-semibold text-gray-700 dark:text-gray-300">{page}</span> of <span className="font-semibold text-gray-700 dark:text-gray-300">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page <= 1 || reviewsLoading}
                                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/5"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pg = i + 1
                                if (totalPages > 5) {
                                    if (page <= 3) pg = i + 1
                                    else if (page >= totalPages - 2) pg = totalPages - 4 + i
                                    else pg = page - 2 + i
                                }
                                return (
                                    <button
                                        type="button"
                                        key={pg}
                                        onClick={() => handlePageChange(pg)}
                                        disabled={reviewsLoading}
                                        className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${pg === page
                                            ? 'bg-primary-600 text-white'
                                            : 'border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        {pg}
                                    </button>
                                )
                            })}
                            <button
                                type="button"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages || reviewsLoading}
                                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:hover:bg-white/5"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Submit / Edit Modal ──────────────────────────────── */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={isEditing ? 'Update your review' : 'Write a review'}
                size="md"
                footer={
                    <div className="flex justify-end gap-3 border-t border-gray-100 p-4 dark:border-white/10">
                        <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-2 text-sm text-gray-500 transition-colors hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="rounded-xl bg-primary-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : isEditing ? 'Update' : 'Submit'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-5 p-6">
                    <div className="text-center">
                        <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-200">How was your experience?</p>
                        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Tap 1–5 stars for your experience score (required).</p>
                        <StarInput
                            label=""
                            value={form.rating}
                            onChange={(v) => setForm((f) => ({ ...f, rating: v }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-500">Comments (optional)</p>
                            <p className={`text-[10px] font-bold ${form.comment.trim().split(/\s+/).filter(Boolean).length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                                {form.comment.trim().split(/\s+/).filter(Boolean).length} / 500 words
                            </p>
                        </div>
                        <textarea
                            rows={4}
                            value={form.comment}
                            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                            placeholder="Tell us more about your experience (max 500 words)..."
                            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm text-gray-700 outline-none transition-all focus:border-primary-200 focus:ring-2 focus:ring-primary-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200 dark:focus:border-primary-800 dark:focus:ring-primary-900/40"
                        />
                    </div>
                </div>
            </Modal>

            {/* ── Visibility Confirmation ───────────────────────────── */}
            <ConfirmDialog
                isOpen={confirmVisibility.open}
                onClose={() => setConfirmVisibility({ ...confirmVisibility, open: false })}
                onConfirm={handleToggleVisibility}
                title={confirmVisibility.currentlyVisible ? 'Hide Review?' : 'Publish Review?'}
                message={
                    confirmVisibility.currentlyVisible
                        ? 'This review will be removed from the public package page and will no longer be visible to guests or agents.'
                        : 'This review will be made public and will be included in the average rating for all users.'
                }
                confirmText={confirmVisibility.currentlyVisible ? 'Hide Review' : 'Publish Review'}
                cancelText="Cancel"
                variant={confirmVisibility.currentlyVisible ? 'danger' : 'primary'}
            />
        </div>
    )
}
