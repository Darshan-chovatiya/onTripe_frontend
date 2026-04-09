import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import BookingReviews from '@/shared/components/BookingReviews'
import { useAuth } from '@/shared/context/AuthContext'
import axiosInstance from '@/shared/services/axiosInstance'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PackageReviewsPage() {
    const { packageId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const readOnly = searchParams.get('readOnly') === 'true'
    const bookingStatus = searchParams.get('status') || 'completed'
    const bookingId = searchParams.get('bookingId')

    const [pkg, setPkg] = useState(null)

    useEffect(() => {
        const fetchPkg = async () => {
            try {
                // Try fetching package title from guest or admin endpoint
                const url = user?.role === 'customer'
                    ? `/customer/packages/${packageId}`
                    : `/admin/packages/${packageId}`
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
    const isAgency = ['parent_agency', 'child_agency', 'sub_child_agent'].includes(user?.role)
    const isCustomer = user?.role === 'customer'

    return (
        <div className={`min-h-[80vh] ${isCustomer ? 'bg-gray-50 py-8 px-4 sm:px-6 lg:px-8' : 'animate-fade-in space-y-6'}`}>
            <div className={isCustomer ? 'max-w-7xl mx-auto' : 'space-y-4'}>

                {/* ── BREADCRUMBS ── */}
                {!isCustomer && (
                    <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
                        <Link
                            to={isAdmin ? "/admin/packages" : "/agency/packages"}
                            className="font-medium text-primary-700 transition-colors hover:text-primary-800"
                        >
                            {isAdmin ? 'Packages Management' : 'Inventory'}
                        </Link>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
                        <span className="max-w-[min(100vw-8rem,280px)] truncate font-medium text-gray-800">
                            {pkg?.title || 'Package'}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
                        <span className="font-semibold text-gray-900">Experience Reviews</span>
                    </nav>
                )}

                {/* ── HEADER ── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {isCustomer && (
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                        )}
                        <div>
                            <h1 className={`${isCustomer ? 'text-2xl' : 'text-xl sm:text-2xl'} font-bold text-gray-900 tracking-tight`}>
                                {isCustomer ? 'Guest Experience' : 'Package Reviews'}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {isCustomer
                                    ? 'Real feedback from travelers who experienced this package.'
                                    : `Feedback and ratings for ${pkg?.title || 'this package'}.`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── CONTENT ── */}
                <div className={`bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden ${isCustomer ? 'p-6 sm:p-10 mt-6' : 'p-6 sm:p-8'}`}>
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
    )
}
