import { useMemo, useState } from 'react'
import { CalendarDays, Eye, IndianRupee, Plus, Ticket, MessageSquare, Pencil } from 'lucide-react'
import { useChildBookings } from '@/travelAgency/childAgency/hooks/useChildBookings.js'
import { useChildPackages } from '@/travelAgency/childAgency/hooks/useChildPackages.js'
import CreateBookingModal from '@/travelAgency/childAgency/components/CreateBookingModal.jsx'
import BookingDetailModal from '@/travelAgency/childAgency/components/BookingDetailModal.jsx'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import Modal from '@/shared/components/Modal.jsx'
import CommunityChat from '@/customer/components/CommunityChat.jsx'
import { basePackageFromBooking } from '@/travelAgency/shared/utils/bookingDetailHelpers.js'

function bookingOfferLabel(b) {
  if (b.whitelabelPackage) {
    const wl = b.whitelabelPackage
    const base = typeof wl.originalPackage === 'object' && wl.originalPackage?.title
    return wl.customTitle || base || 'White-label'
  }
  return b.package?.title || '—'
}

function statusClass(status) {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800'
    case 'ongoing':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-gray-200 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default function Bookings() {
  const { bookings, loading, error, create, fetchBooking, updateBooking, currentUserId } = useChildBookings()
  const { availablePackages, whitelabels } = useChildPackages()
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [detailOpenEdit, setDetailOpenEdit] = useState(false)
  const [chatPackageId, setChatPackageId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const sorted = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime()
        const tb = new Date(b.createdAt || 0).getTime()
        return tb - ta
      }),
    [bookings]
  )

  const handleCreate = async (formData) => {
    setSubmitting(true)
    try {
      await create(formData)
      toast.success('Booking created successfully')
      setModalOpen(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateBooking = async (id, body) => {
    try {
      const updated = await updateBooking(id, body)
      toast.success('Booking updated')
      return updated
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      throw err
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            All bookings you and your sub-child agencies have created. Start a new booking for a parent package or one
            of your white-label offers.
          </p>
        </div>
        <Button type="button" onClick={() => setModalOpen(true)}>
          <Plus className="mr-1.5 inline h-4 w-4" />
          New booking
        </Button>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading && sorted.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="animate-pulse space-y-3 p-6">
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded bg-gray-100" />
            ))}
          </div>
        </div>
      ) : null}

      {!loading && sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
          <Ticket className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">No bookings yet</p>
          <p className="mt-1 max-w-md text-xs text-gray-400">
            When you or a sub-child agent confirms a trip, it will show up here. Use New booking to add one now.
          </p>
          <Button type="button" className="mt-4" onClick={() => setModalOpen(true)}>
            <Plus className="mr-1.5 inline h-4 w-4" />
            New booking
          </Button>
        </div>
      ) : null}

      {sorted.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">Booking ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Package / offer</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Travel date</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Booked by</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((b) => {
                  const communityPackageId = basePackageFromBooking(b)?._id || b?.package?._id || null
                  const bookedBy = b.bookedBy
                  const isSelf = currentUserId && bookedBy && String(bookedBy._id || bookedBy) === String(currentUserId)
                  return (
                    <tr key={b._id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">{b.bookingId}</td>
                      <td className="max-w-[12rem] px-4 py-3 text-gray-800">
                        <span className="line-clamp-2">{bookingOfferLabel(b)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="font-medium text-gray-900">{b.customer?.name || '—'}</div>
                        <div className="text-xs">{b.customer?.phone || ''}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                          {b.travelDate
                            ? new Date(b.travelDate).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-800">
                        <span className="inline-flex items-center gap-0.5">
                          <IndianRupee className="h-3.5 w-3.5" />
                          {b.totalAmount != null ? Number(b.totalAmount).toLocaleString('en-IN') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {typeof bookedBy === 'object' && bookedBy?.name ? (
                          <>
                            {bookedBy.name}
                            {isSelf ? <span className="text-xs text-gray-400"> (you)</span> : null}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusClass(
                            b.bookingStatus
                          )}`}
                        >
                          {b.bookingStatus || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => { setDetailId(b._id); setDetailOpenEdit(false) }}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDetailId(b._id); setDetailOpenEdit(true) }}
                          className="ml-2 inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => communityPackageId && setChatPackageId(communityPackageId)}
                          disabled={!communityPackageId}
                          title={communityPackageId ? 'Open community chat' : 'Community chat not available'}
                          className={`ml-2 inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            communityPackageId
                              ? 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                              : 'opacity-50 cursor-not-allowed text-gray-300'
                          }`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <CreateBookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        loading={submitting}
        availablePackages={availablePackages}
        whitelabels={whitelabels}
      />

      <BookingDetailModal
        isOpen={Boolean(detailId)}
        onClose={() => { setDetailId(null); setDetailOpenEdit(false) }}
        bookingId={detailId}
        fetchBooking={fetchBooking}
        updateBooking={handleUpdateBooking}
        openInEdit={detailOpenEdit}
      />

      <Modal
        isOpen={!!chatPackageId}
        onClose={() => setChatPackageId(null)}
        title="Community chat"
        size="xl"
      >
        {chatPackageId ? <CommunityChat packageId={chatPackageId} currentUserId={currentUserId} /> : null}
      </Modal>
    </div>
  )
}
