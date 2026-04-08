import { useEffect, useState } from 'react'
import { Star, Edit2, Trash2, Plus, MessageSquare } from 'lucide-react'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Modal from '@/shared/components/Modal.jsx'
import Loader from '@/shared/components/Loader.jsx'

// Star rating input component
function StarInput({ value, onChange, label }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      <div className="flex gap-1">
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
              className={`transition-colors ${(hovered || value) >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

// Display stars (read-only)
function StarDisplay({ value, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={value >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
        />
      ))}
    </div>
  )
}

export default function ReviewSection({ bookingId, packageId, bookingStatus }) {
  const { toast } = useToast()

  const [myReview, setMyReview] = useState(null)
  const [allReviews, setAllReviews] = useState([])
  const [avgPackageRating, setAvgPackageRating] = useState(null)
  const [avgOverallRating, setAvgOverallRating] = useState(null)
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ packageRating: 0, overallRating: 0, comment: '' })

  const canReview = ['ongoing', 'completed'].includes(bookingStatus)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [myRes, allRes] = await Promise.allSettled([
        axiosInstance.get(`/customer/bookings/${bookingId}/review`),
        axiosInstance.get(`/customer/packages/${packageId}/reviews`)
      ])

      if (myRes.status === 'fulfilled' && myRes.value.data?.success) {
        setMyReview(myRes.value.data.data.review)
      }

      if (allRes.status === 'fulfilled' && allRes.value.data?.success) {
        const d = allRes.value.data.data
        setAllReviews(d.reviews || [])
        setAvgPackageRating(d.avgPackageRating)
        setAvgOverallRating(d.avgOverallRating)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (bookingId && packageId) fetchData()
  }, [bookingId, packageId])

  const openAddModal = () => {
    setIsEditing(false)
    setForm({ packageRating: 0, overallRating: 0, comment: '' })
    setModalOpen(true)
  }

  const openEditModal = () => {
    setIsEditing(true)
    setForm({
      packageRating: myReview.packageRating,
      overallRating: myReview.overallRating,
      comment: myReview.comment || ''
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.packageRating || !form.overallRating) {
      toast.error('Please provide both ratings')
      return
    }
    setSubmitting(true)
    try {
      if (isEditing) {
        await axiosInstance.patch(`/customer/bookings/${bookingId}/review`, form)
        toast.success('Review updated')
      } else {
        await axiosInstance.post(`/customer/bookings/${bookingId}/review`, form)
        toast.success('Review submitted')
      }
      setModalOpen(false)
      fetchData()
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
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete review')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader size="md" text="Loading reviews..." />
      </div>
    )
  }

  return (
    <div className="space-y-8 px-4 pb-10">
      {/* Summary Bar */}
      {allReviews.length > 0 && (
        <div className="flex flex-wrap gap-6 bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center justify-center flex-1 min-w-[120px]">
            <p className="text-4xl font-black text-gray-900">{avgOverallRating ?? '—'}</p>
            <StarDisplay value={Math.round(avgOverallRating)} size={18} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Overall</p>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 min-w-[120px]">
            <p className="text-4xl font-black text-gray-900">{avgPackageRating ?? '—'}</p>
            <StarDisplay value={Math.round(avgPackageRating)} size={18} />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Package</p>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 min-w-[120px]">
            <p className="text-4xl font-black text-gray-900">{allReviews.length}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Reviews</p>
          </div>
        </div>
      )}

      {/* My Review */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Your Review</h3>
          {canReview && !myReview && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-200"
            >
              <Plus size={14} /> Add Review
            </button>
          )}
        </div>

        {myReview ? (
          <div className="bg-white rounded-[2rem] p-6 border border-primary-100 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Package</p>
                    <StarDisplay value={myReview.packageRating} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Overall</p>
                    <StarDisplay value={myReview.overallRating} />
                  </div>
                </div>
                {myReview.comment && (
                  <p className="text-gray-600 text-sm leading-relaxed">{myReview.comment}</p>
                )}
                <p className="text-[10px] text-gray-400">
                  {new Date(myReview.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={openEditModal}
                  className="p-2.5 rounded-xl bg-gray-50 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2.5 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border-2 border-dashed border-gray-100 p-8 text-center text-gray-300">
            {canReview
              ? <p className="text-sm font-black uppercase tracking-widest">Share your experience</p>
              : <p className="text-sm font-black uppercase tracking-widest">Available after trip starts</p>
            }
          </div>
        )}
      </div>

      {/* All Reviews */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">All Reviews</h3>
        {allReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-200">
            <MessageSquare size={48} strokeWidth={1} />
            <p className="mt-4 text-xs font-black uppercase tracking-widest">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allReviews.map((r) => (
              <div key={r._id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-black text-sm">
                      {(r.customer?.name || 'A')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{r.customer?.name || 'Anonymous'}</p>
                      <p className="text-[10px] text-gray-400">
                        {r.booking?.travelDate
                          ? new Date(r.booking.travelDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                          : new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <StarDisplay value={r.overallRating} />
                </div>
                {r.comment && (
                  <p className="text-sm text-gray-500 leading-relaxed pl-12">{r.comment}</p>
                )}
                <div className="pl-12 flex gap-4">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    Package <span className="text-amber-500">{r.packageRating}/5</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    Overall <span className="text-amber-500">{r.overallRating}/5</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Your Review' : 'Add Your Review'}
        size="sm"
        footer={
          <div className="flex justify-end gap-3 p-4">
            <button
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-black hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update' : 'Submit'}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <StarInput
            label="Package Rating"
            value={form.packageRating}
            onChange={(v) => setForm((f) => ({ ...f, packageRating: v }))}
          />
          <StarInput
            label="Overall Rating"
            value={form.overallRating}
            onChange={(v) => setForm((f) => ({ ...f, overallRating: v }))}
          />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Comment (optional)</p>
            <textarea
              rows={4}
              maxLength={1000}
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Share your experience..."
              className="w-full rounded-2xl border border-gray-200 p-4 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 transition"
            />
            <p className="text-right text-[10px] text-gray-300 mt-1">{form.comment.length}/1000</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
