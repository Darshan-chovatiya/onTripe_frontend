import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Download, Layers, Loader2, MapPin, Calendar, Package, IndianRupee } from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getFileUrl, WhitelabelAgencyChain, NewOfferDetails } from '@/admin/components/WhitelabelOfferBlocks.jsx'
import Modal from '@/shared/components/Modal.jsx'
import HierarchyFlowchart from '@/admin/components/HierarchyFlowchart.jsx'

export default function PackageWhitelabels() {
  const { packageId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  const [loading, setLoading] = useState(true)
  const [pkg, setPkg] = useState(null)
  const [rows, setRows] = useState([])
  const [exportLoading, setExportLoading] = useState(false)
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false)

  const load = useCallback(async () => {
    if (!packageId) return
    setLoading(true)
    try {
      const { data } = await adminApi.listWhitelabelsByPackage(packageId)
      if (data?.success && data.data) {
        setPkg(data.data.package || null)
        setRows(Array.isArray(data.data.whitelabels) ? data.data.whitelabels : [])
      } else {
        setPkg(null)
        setRows([])
      }
    } catch {
      toastRef.current.error('Could not load whitelabels')
    } finally {
      setLoading(false)
    }
  }, [packageId])

  useEffect(() => {
    load()
  }, [load])

  const coverUrl = useMemo(() => getFileUrl(pkg?.coverImage), [pkg?.coverImage])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { exportToExcel } = await import('@/admin/utils/exportExcel.js')
      await exportToExcel(
        rows.map((wl, idx) => {
          const isSubChild = wl.createdBy?.role === 'sub_child_agent'
          const basePrice = Number(pkg?.basePrice || 0)
          const finalPrice = Number(wl.finalPrice || 0)
          const commission = wl.commissionType === 'percentage'
            ? `${wl.commissionValue ?? 0}%`
            : wl.commissionType === 'flat'
              ? `₹${Number(wl.commissionValue || 0).toLocaleString('en-IN')}`
              : '—'

          return {
            '#': idx + 1,
            'Whitelabel Title': wl.customTitle || pkg?.title || '—',
            'Custom Description': wl.customDescription || '—',
            'Source Type': isSubChild
              ? 'Sub-child (whitelabelled from child whitelabel)'
              : 'Child (whitelabelled from original package)',
            'Original Package': pkg?.title || '—',
            'Original Package Owner (Parent Agency)': pkg?.createdBy?.name || '—',
            ...(isSubChild ? {
              'Child Agency (Whitelabel Source)': wl.ownedByParent?.name || '—',
              'Child Agency Code': wl.ownedByParent?.agentCode || '—',
              'Child Agency Email': wl.ownedByParent?.email || '—',
              'Sub-Child Agent (Created By)': wl.createdBy?.name || '—',
              'Sub-Child Agent Code': wl.createdBy?.agentCode || '—',
              'Sub-Child Agent Email': wl.createdBy?.email || '—',
            } : {
              'Child Agent (Created By)': wl.createdBy?.name || '—',
              'Child Agent Code': wl.createdBy?.agentCode || '—',
              'Child Agent Email': wl.createdBy?.email || '—',
              'Parent Agency': wl.ownedByParent?.name || '—',
              'Parent Agency Code': wl.ownedByParent?.agentCode || '—',
            }),
            'Destination': pkg?.destination || '—',
            'Total Days': pkg?.totalDays ?? '—',
            'Base Price (INR)': basePrice,
            'Commission': commission,
            'Commission Type': wl.commissionType || '—',
            'Final Offer Price (INR)': finalPrice,
            'Status': wl.isActive ? 'Active' : 'Inactive',
            'Created On': wl.createdAt ? new Date(wl.createdAt).toLocaleDateString() : '—',
          }
        }),
        `whitelabels-${pkg?.title || 'package'}`,
        'Whitelabels'
      )
    } catch {
      toastRef.current.error('Export failed')
    } finally {
      setExportLoading(false)
    }
  }

  if (loading && !pkg) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
        <p className="text-sm text-gray-500">Loading whitelabels…</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link to="/admin/packages" className="font-medium text-primary-700 transition-colors hover:text-primary-800">
          Packages Management
        </Link>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
        <span className="max-w-[min(100vw-8rem,280px)] truncate font-medium text-gray-800" title={pkg?.title}>
          {pkg?.title || 'Package'}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
        <span className="font-semibold text-gray-900">Whitelabels</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Package whitelabels</h1>
          <p className="mt-1 text-sm text-gray-500">
            Source inventory below; each card is a downstream offer with agency chain and offer details.
          </p>
        </div>
        <button 
           type="button"
           onClick={() => setIsHierarchyModalOpen(true)}
           className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-violet-700 transition-all shadow-sm"
        >
           <Layers className="h-4 w-4" /> Package distribution map
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-3 py-2 sm:px-4">
          <Package className="h-3.5 w-3.5 text-primary-600" strokeWidth={2} />
          <h2 className="text-xs font-semibold text-gray-900">Source package</h2>
        </div>
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start">
          <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-20 sm:w-36">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-300">
                <Layers className="h-8 w-8" strokeWidth={1.25} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <h3 className="text-base font-semibold leading-snug text-gray-900">{pkg?.title || '—'}</h3>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600">
                {pkg?.destination ? (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                    {pkg.destination}
                  </span>
                ) : null}
                {pkg?.totalDays != null ? (
                  <span className="inline-flex items-center gap-0.5">
                    <Calendar className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                    {pkg.totalDays}d
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-0.5 font-medium tabular-nums text-gray-900">
                  <IndianRupee className="h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
                  {Number(pkg?.basePrice || 0).toLocaleString('en-IN')} {pkg?.currency || 'INR'}
                </span>
              </div>
            </div>
            {pkg?.description ? (
              <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">{pkg.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-2 py-1.5 text-xs">
              <span className="font-medium text-gray-500">Parent:</span>
              <span className="font-semibold text-gray-900">{pkg?.createdBy?.name || '—'}</span>
              <span className="text-gray-400">·</span>
              <span className="truncate text-gray-600">{pkg?.createdBy?.email || '—'}</span>
              <span className="font-medium text-primary-700">{pkg?.createdBy?.agentCode || '—'}</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-gray-900">Whitelabel offers</h2>
          <div className="flex items-center gap-2">
            {!loading && rows.length > 0 && (
              <>
                <span className="text-xs text-gray-500">{rows.length} offer{rows.length === 1 ? '' : 's'}</span>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exportLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {exportLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    : <Download className="h-4 w-4" strokeWidth={2} />}
                  Export
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" strokeWidth={2} />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center shadow-sm">
            <Layers className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-semibold text-gray-900">No whitelabels yet</p>
            <p className="mt-1 text-sm text-gray-500">
              No child or sub-child has created an offer from this package yet.
            </p>
            <button
              type="button"
              onClick={() => navigate('/admin/packages')}
              className="mt-4 text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Back to packages
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((wl) => (
              <li
                key={String(wl._id)}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <WhitelabelAgencyChain wl={wl} />
                <NewOfferDetails wl={wl} basePkg={pkg} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
         isOpen={isHierarchyModalOpen}
         onClose={() => setIsHierarchyModalOpen(false)}
         title={`Package map · ${pkg?.title || 'Package'}`}
         size="full"
      >
         <div className="flex h-[calc(100dvh-7rem)] min-h-[min(560px,85dvh)] w-full flex-col">
            <HierarchyFlowchart type="package" id={packageId} />
         </div>
      </Modal>
    </div>
  )
}