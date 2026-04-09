import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import CommunityChat from '@/customer/components/CommunityChat.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'

export default function BookingCommunity() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [packageId, setPackageId] = useState(null)
  const [customerId, setCustomerId] = useState(null)
  const [tripTitle, setTripTitle] = useState('Trip')

  useEffect(() => {
    let alive = true
    const run = async () => {
      if (!bookingId) {
        navigate('/customer/booking', { replace: true })
        return
      }
      setLoading(true)
      try {
        const { data } = await axiosInstance.get(`/customer/bookings/${bookingId}`)
        if (!alive) return
        if (data?.success && data.data?.booking) {
          const b = data.data.booking
          const pid = b.package?._id
          if (!pid) {
            toast.error('No package linked to this booking')
            navigate(`/customer/booking/${bookingId}`, { replace: true })
            return
          }
          setPackageId(String(pid))
          const cid = b.customer?._id || b.customer
          setCustomerId(cid ? String(cid) : null)
          const wl = b.whitelabelPackage
          const label =
            (wl && (wl.customTitle || (typeof wl.originalPackage === 'object' && wl.originalPackage?.title))) ||
            b.package?.title ||
            'Trip'
          setTripTitle(label)
        } else {
          toast.error(data?.message || 'Booking not found')
          navigate('/customer/booking', { replace: true })
        }
      } catch {
        if (alive) {
          toast.error('Could not load booking')
          navigate('/customer/booking', { replace: true })
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [bookingId, navigate, toast])

  if (loading || !packageId) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader size="lg" />
        <p className="text-sm text-gray-500">Loading chat…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col pb-24">

      <div className="h-[calc(100vh-14rem)] min-h-[360px] overflow-hidden sm:h-[calc(100vh-12rem)]">
        <CommunityChat packageId={packageId} customerId={customerId || user?.id} layout="page" />
      </div>
    </div>
  )
}
