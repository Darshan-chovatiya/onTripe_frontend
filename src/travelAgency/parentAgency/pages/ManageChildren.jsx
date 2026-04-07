import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Users, CheckCircle, XCircle, Clock, Eye, Mail, Phone, User, ShieldCheck, UserCheck } from 'lucide-react'
import { listChildAgencies, toggleChildAgentStatus, approveChildKyc } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
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
  const [toggleTarget, setToggleTarget] = useState(null)
  const [toggling, setToggling] = useState(false)
  const [kycTarget, setKycTarget] = useState(null)
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

  const handleApproveKyc = async () => {
    if (!kycTarget) return
    try {
      await approveChildKyc(kycTarget._id)
      toast.success(`KYC approved for ${kycTarget.name}`)
      await fetchChildren()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setKycTarget(null)
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
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-gray-500">Total: <span className="font-semibold text-gray-800">{children.length}</span></span>
          <span className="text-gray-500">Approved: <span className="font-semibold text-gray-800">{children.filter(c => c.kyc?.status === 'approved').length}</span></span>
          <span className="text-gray-500">Pending: <span className="font-semibold text-gray-800">{children.filter(c => c.kyc?.status === 'pending').length}</span></span>
          <span className="text-gray-500">Rejected: <span className="font-semibold text-gray-800">{children.filter(c => c.kyc?.status === 'rejected').length}</span></span>
        </div>
      )}

      {/* Error */}
      {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}

      {/* Loading skeleton */}
      {loading && children.length === 0 && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4 animate-pulse flex gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
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

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                  <th className="px-5 py-3 text-left">Agent Name</th>
                  <th className="px-5 py-3 text-left">Contact Info</th>
                  <th className="px-5 py-3 text-left">KYC Status</th>
                  <th className="px-5 py-3 text-left">Account Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(child => {
                  const kycStatus = child.kyc?.status || 'pending'
                  const KycIcon = KYC_ICONS[kycStatus] || Clock

                  return (
                    <tr key={child._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{child.name}</p>
                            <p className="text-xs text-gray-400">Agent ID: {child._id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="flex items-center gap-1.5 text-gray-700"><Mail size={12} className="text-gray-400" />{child.email || '—'}</p>
                        {child.phone && <p className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5"><Phone size={11} className="text-gray-400" />{child.phone}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${KYC_STYLES[kycStatus]}`}>
                          <KycIcon size={12} />
                          {kycStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setToggleTarget(child)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all hover:ring-2 hover:ring-offset-1 ${
                            child.isActive 
                              ? 'bg-green-50 text-green-700 hover:ring-green-200' 
                              : 'bg-red-50 text-red-700 hover:ring-red-200'
                          }`}
                          title={child.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                        >
                          <ShieldCheck size={12} />
                          {child.isActive ? 'Active' : 'Deactivated'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-3">
                          <button 
                            onClick={() => setViewId(child._id)} 
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all" 
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {child.kyc?.status === 'pending' && (
                            <button
                              onClick={() => setKycTarget(child)}
                              className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all"
                              title="Approve KYC"
                            >
                              <UserCheck size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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

      <ConfirmDialog
        isOpen={!!kycTarget}
        onClose={() => setKycTarget(null)}
        onConfirm={handleApproveKyc}
        title="Approve KYC"
        message={`Approve KYC for "${kycTarget?.name}"? They will gain full access to the platform.`}
        confirmText="Approve"
        cancelText="Cancel"
        variant="primary"
      />
    </div>
  )
}

