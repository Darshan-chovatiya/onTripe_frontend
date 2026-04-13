import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import BookingReviews from '@/shared/components/BookingReviews.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'

export default function PackageReviewsPage() {
  const { packageId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const readOnly = searchParams.get('readOnly') === 'true'
  const bookingId = searchParams.get('bookingId')
  const bookingStatus = searchParams.get('status') || (bookingId ? 'completed' : '')

  const [pkg, setPkg] = useState(null)

  useEffect(() => {
    const fetchPkg = async () => {
      try {
        const url =
          user?.role === 'customer' ? `/customer/packages/${packageId}` : `/admin/packages/${packageId}`
        const res = await axiosInstance.get(url)
        if (res.data?.success) {
          setPkg(res.data.data.package)
        }
      } catch (err) {
        console.error('Failed to fetch package title', err)
      }
    }
    if (packageId) fetchPkg()
  }, [packageId, user?.role])

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isCustomer = user?.role === 'customer'

  if (isCustomer) {
    return (
      <div className="mx-auto max-w-5xl pb-24 sm:pb-28">
        <div className="mb-6 flex items-start gap-3 sm:mb-8 sm:items-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-700 dark:border-white/10 dark:bg-gray-950 dark:text-gray-300 dark:hover:border-primary-800 dark:hover:bg-primary-950/30"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-primary-600/90 dark:text-primary-400/90">
              Feedback
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Guest experience
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              See what other travelers said and share your own rating for this trip.
            </p>
            {pkg?.title ? (
              <p className="mt-2 truncate text-sm font-medium text-gray-700 dark:text-gray-300">{pkg.title}</p>
            ) : null}
          </div>
        </div>

        {!bookingId ? (
          <div
            className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
            role="status"
          >
            To add your experience score, open <span className="font-medium">Guest experience</span> from your trip:{' '}
            <span className="font-medium">Trips</span> → choose your booking → <span className="font-medium">Review</span>.
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-white/10 dark:bg-gray-950">
          <div className="p-5 sm:p-6 md:p-8">
            <BookingReviews
              packageId={packageId}
              bookingId={bookingId}
              readOnly={readOnly}
              bookingStatus={bookingStatus}
              variant="customer"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] animate-fade-in space-y-6">
      <div className="space-y-4">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
          <Link
            to={isAdmin ? '/admin/packages' : '/agency/packages'}
            className="font-medium text-primary-700 transition-colors hover:text-primary-800"
          >
            {isAdmin ? 'Packages Management' : 'Inventory'}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
          <span className="max-w-[min(100vw-8rem,280px)] truncate font-medium text-gray-800">
            {pkg?.title || 'Package'}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
          <span className="font-semibold text-gray-900">Experience reviews</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Package reviews</h1>
            <p className="mt-1 text-sm text-gray-500">
              Feedback and ratings for {pkg?.title || 'this package'}.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <BookingReviews
              packageId={packageId}
              bookingId={bookingId}
              readOnly={readOnly}
              bookingStatus={bookingStatus}
              reviewsApiEndpoint={readOnly ? `/admin/reviews?packageId=${packageId}` : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
