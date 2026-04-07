import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Users, CheckCircle, XCircle, Clock, Eye } from 'lucide-react'
import { listChildAgencies, toggleChildAgentStatus } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import ChildAgentDetailModal from '@/travelAgency/parentAgency/components/ChildAgentDetailModal.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'

const KYC_STYLES = {
  approved: 'bg-green-50 text-green-700',
  pending:  'bg-yellow-50 text-yellow-700',
  rejected: 'bg-red-50 text-red-700',
}

const KYC_ICONS = {
  approved: CheckCircle,
  pending:  Clock,
  rejected: XCircle,
}

export default function ManageChildren() {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [kycFilter, setKycFilter] = useState('all')
  const [viewId, setViewId] = useState(null)
  const [toggleTarget, setToggleTarget] = useState(null) // { _id, name, isActive }
  const [toggling, setToggling] = useState(false)
  const { toast } = useToast()

  const fetchChildren = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listChildAgencies()
      setChildren(res.data?.data?.children || [])
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchChildren() }, [fetchChildren])

  const handleToggle = async () => {
    if (!toggleTarget) return
    setToggling(true)
    try {
      await toggleChildAgentStatus(toggleTarget._id)
      toast.success(toggleTarget.isActive ? `${toggleTarget.name} deactivated` : `${toggleTarget.name} activated`)
      await fetchChildren()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setToggling(false)
      setToggleTarget(null)
    }
  }

  const filtered = children.filter(c => {
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    const matchKyc = kycFilter === 'all' || c.kyc?.status === kycFilter
    return matchSearch && matchKyc
  })

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Child Agents</h1>
          <p className="text-sm text-gray-500 mt-0.5">Agents linked to your network</p>
        </div>
        <button onClick={fetchChildren} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Refresh">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="input-field flex-1"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input-field sm:w-44" value={kycFilter} onChange={e => setKycFilter(e.target.value)}>
          <option value="all">All KYC Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Stats */}
      {children.length > 0 && (
        <div className="flex gap-4 text-sm">
          <span className="text-gray-500">Total: <span className="font-semibold text-gray-800">{children.length}</span></span>
          <span className="text-green-600">KYC Approved: <span className="font-semibold">{children.filter(c => c.kyc?.status === 'approved').length}</span></span>
          <span className="text-yellow-600">Pending: <span className="font-semibold">{children.filter(c => c.kyc?.status === 'pending').length}</span></span>
          <span className="text-red-500">Rejected: <span className="font-semibold">{children.filter(c => c.kyc?.status === 'rejected').length}</span></span>
        </div>
      )}

      {/* Error */}
      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {/* Loading skeleton */}
      {loading && children.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-14 w-14 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">
            {children.length === 0 ? 'No child agents yet' : 'No agents match your search'}
          </h3>
          {children.length === 0 && (
            <p className="text-sm text-gray-400 mt-1">Share your agent code so child agents can link to you.</p>
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Phone</th>
                <th className="px-5 py-3 text-left">KYC</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(child => {
                const kycStatus = child.kyc?.status || 'pending'
                const KycIcon = KYC_ICONS[kycStatus] || Clock

                return (
                  <tr key={child._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{child.name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{child.email || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{child.phone || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${KYC_STYLES[kycStatus]}`}>
                        <KycIcon size={10} />
                        {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${child.isActive ? 'text-green-600' : 'text-red-500'}`}>
                        <Users size={12} />
                        {child.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-3">
                        <button onClick={() => setViewId(child._id)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                          <Eye size={13} /> View
                        </button>
                        <button
                          onClick={() => setToggleTarget(child)}
                          className={`text-xs font-medium transition-colors ${child.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                        >
                          {child.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* Detail modal */}
      <ChildAgentDetailModal
        isOpen={!!viewId}
        onClose={() => setViewId(null)}
        childId={viewId}
      />

      {/* Toggle status confirm */}
      <ConfirmDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        title={toggleTarget?.isActive ? 'Deactivate Child Agent' : 'Activate Child Agent'}
        message={
          toggleTarget?.isActive
            ? `Deactivating "${toggleTarget?.name}" will prevent them from signing in until their account is reactivated.`
            : `Activating "${toggleTarget?.name}" will allow them to sign in again.`
        }
        confirmText={toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        variant={toggleTarget?.isActive ? 'danger' : 'primary'}
      />
    </div>
  )
}
