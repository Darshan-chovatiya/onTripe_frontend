import { useEffect, useRef, useState, useCallback } from 'react'
import { Star, Edit2, Trash2, MessageSquare, Calendar, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useAuth } from '@/shared/context/AuthContext'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Modal from '@/shared/components/Modal.jsx'
import Loader from '@/shared/components/Loader.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'

const PAGE_SIZE = 5

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
    if (text.length <= limit) return <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">{text}</p>

    return (
        <div className="space-y-1">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                {expanded ? text : `${text.substring(0, limit)}...`}
            </p>
            <button
                onClick={() => setExpanded(!expanded)}
                className="text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider"
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
}) {
    const { toast } = useToast()
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

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
    const [summaryLoading, setSummaryLoading] = useState(true)

    // ── Modal state ────────────────────────────────────────────────
    const [modalOpen, setModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [form, setForm] = useState({ rating: 0, comment: '' })

    // ── Visibility Toggling ────────────────────────────────────────
    const [confirmVisibility, setConfirmVisibility] = useState({ open: false, reviewId: null, currentlyVisible: true })

    const canReview = !readOnly && ['ongoing', 'completed'].includes(bookingStatus)

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
        if (readOnly || !bookingId) return
        try {
            const res = await axiosInstance.get(`/customer/bookings/${bookingId}/review`)
            if (res.data?.success) setMyReview(res.data.data.review)
        } catch {
            setMyReview(null)
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

    if (summaryLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader size="lg" />
                <p className="mt-3 text-sm text-gray-400">Loading reviews...</p>
            </div>
        )
    }

    const visibleReviews = allReviews.filter(r => r._id !== myReview?._id)

    return (
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-0 min-h-0">

            {/* ── LEFT: Stats + My Review ────────────────────────── */}
            <div className="border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6 space-y-5 md:sticky md:top-0 h-fit">

                {/* Summary Stats Cards */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Review Summary</h4>

                    {/* Score Card */}
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                        <p className="text-[10px] font-bold opacity-70 mb-1 uppercase tracking-wider">Experience Score</p>
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-black">{avgOverallRating.toFixed(1)}</span>
                            <StarDisplay value={Math.round(avgOverallRating)} size={16} />
                        </div>
                    </div>

                    {/* Count Card */}
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                        <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Total Feedback</p>
                        <div className="flex items-center justify-between">
                            <span className="text-3xl font-black text-gray-900">{totalReviews}</span>
                            <div className="p-2 bg-white rounded-xl border border-gray-100">
                                <MessageSquare size={16} className="text-primary-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Write review CTA */}
                {!readOnly && canReview && !myReview && (
                    <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 text-center space-y-2">
                        <p className="text-sm font-bold text-gray-800">Share your experience</p>
                        <p className="text-xs text-gray-500">How was the trip?</p>
                        <button
                            onClick={openAddModal}
                            className="w-full bg-primary-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-primary-700 transition-colors"
                        >
                            Write a Review
                        </button>
                    </div>
                )}

                {/* My Review */}
                {!readOnly && myReview && (
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your Review</h4>
                        <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">Your Rating</p>
                                    <StarDisplay value={myReview.overallRating} size={14} showLabel />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={openEditModal} className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-white">
                                        <Edit2 size={13} />
                                    </button>
                                    <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-white">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                            {myReview.comment && (
                                <div className="mt-3">
                                    <ReadMore text={myReview.comment} limit={150} />
                                </div>
                            )}
                            <p className="mt-3 text-[9px] text-gray-400 flex items-center gap-1">
                                <Calendar size={9} /> {new Date(myReview.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── RIGHT: Paginated Reviews ─────────────────────────── */}
            <div className="md:pl-6 pt-4 md:pt-0 flex flex-col gap-4 min-h-0">
                <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Guest Feedback {totalReviews > 0 && <span className="normal-case text-gray-300">({totalReviews})</span>}
                    </h4>
                    {totalReviews === 0 && !reviewsLoading && (
                        <span className="text-xs text-gray-400">No reviews yet</span>
                    )}
                </div>

                {/* Review Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[55vh] pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {reviewsLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader size="md" />
                        </div>
                    ) : visibleReviews.length === 0 ? (
                        <div className="py-16 text-center text-gray-400">
                            <MessageSquare className="mx-auto mb-2 opacity-20" size={28} />
                            <p className="text-sm">No reviews found.</p>
                        </div>
                    ) : (
                        visibleReviews.map((r) => (
                            <div
                                key={r._id}
                                className={`group relative border rounded-2xl p-4 transition-all ${!r.isVisible
                                        ? 'bg-red-50/30 border-red-100 shadow-inner'
                                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0">
                                            {(r.customer?.name || 'G')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 leading-tight">{r.customer?.name || 'Guest'}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
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
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                            Page <span className="font-bold text-gray-700">{page}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page <= 1 || reviewsLoading}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                                        key={pg}
                                        onClick={() => handlePageChange(pg)}
                                        disabled={reviewsLoading}
                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${pg === page
                                            ? 'bg-primary-600 text-white'
                                            : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pg}
                                    </button>
                                )
                            })}
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages || reviewsLoading}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 p-4 border-t border-gray-100">
                        <button onClick={() => setModalOpen(false)} className="w-full sm:w-auto px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full sm:w-auto px-6 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? 'Saving...' : isEditing ? 'Update' : 'Submit'}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-5">
                    <div className="text-center">
                        <p className="text-sm font-bold text-gray-700 mb-3">How was your experience?</p>
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
                            className="w-full border border-gray-200 rounded-xl p-3.5 text-sm text-gray-700 focus:ring-2 focus:ring-primary-100 focus:border-primary-200 outline-none transition-all resize-none bg-gray-50/50"
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
