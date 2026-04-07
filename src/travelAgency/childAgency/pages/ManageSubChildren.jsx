import { useState } from 'react'
import { Eye, RefreshCw, Users, UserCheck, UserX } from 'lucide-react'
import { useManageSubChildren } from '@/travelAgency/childAgency/hooks/useManageSubChildren.js'
import SubChildDetailModal from '@/travelAgency/childAgency/components/SubChildDetailModal.jsx'
import Button from '@/shared/components/Button.jsx'
import ConfirmDialog from '@/shared/components/ConfirmDialog.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { approveSubChildKyc } from '@/travelAgency/childAgency/services/childAgencyApi.js'

export default function ManageSubChildren() {
  const { subChildren, loading, error, refresh, fetchOne, setActive } = useManageSubChildren()
  const { toast } = useToast()
  const [detailId, setDetailId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState({ open: false, sub: null, nextActive: false })
  const [kycTarget, setKycTarget] = useState(null)

  const runToggle = async (sub, nextActive) => {
    setBusyId(sub._id)
    try {
      await setActive(sub._id, nextActive)
      toast.success(nextActive ? 'Sub-child account activated' : 'Sub-child account deactivated')
      setConfirm({ open: false, sub: null, nextActive: false })
      if (!nextActive && detailId && String(detailId) === String(sub._id)) {
        setDetailId(null)
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      throw err
    } finally {
      setBusyId(null)
    }
  }

  const requestToggle = (sub, nextActive) => {
    if (!nextActive) {
      setConfirm({ open: true, sub, nextActive })
      return
    }
    runToggle(sub, nextActive)
  }

  const handleApproveKyc = async () => {
    if (!kycTarget) return
    setBusyId(kycTarget._id)
    try {
      await approveSubChildKyc(kycTarget._id)
      toast.success(`KYC approved for ${kycTarget.name}`)
      refresh()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBusyId(null)
      setKycTarget(null)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage sub-children</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sub-child agencies registered with your invitation codes. Review their profile, then activate or
            deactivate access as needed.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => refresh()} disabled={loading}>
          <RefreshCw className={`mr-1.5 inline h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading && subChildren.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="animate-pulse space-y-3 p-6">
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-10 rounded bg-gray-100" />
            <div className="h-10 rounded bg-gray-100" />
            <div className="h-10 rounded bg-gray-100" />
          </div>
        </div>
      ) : null}

      {!loading && subChildren.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
          <Users className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">No sub-child agencies yet</p>
          <p className="mt-1 max-w-md text-xs text-gray-400">
            Generate a sub-child invitation code from your agency tools. When agents register with that code, they
            will appear in this list.
          </p>
        </div>
      ) : null}

      {subChildren.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Phone</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">KYC</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subChildren.map((sub) => (
                  <tr key={sub._id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">{sub.name}</td>
                    <td className="px-4 py-3 text-gray-600">{sub.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{sub.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        sub.kyc?.status === 'approved' ? 'bg-green-50 text-green-700' :
                        sub.kyc?.status === 'rejected' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {sub.kyc?.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <UserCheck className="h-3.5 w-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
                          <UserX className="h-3.5 w-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailId(sub._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                        {sub.kyc?.status === 'pending' && (
                          <button
                            type="button"
                            disabled={busyId === sub._id}
                            onClick={() => setKycTarget(sub)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            Approve KYC
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === sub._id}
                          onClick={() => requestToggle(sub, !sub.isActive)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                            sub.isActive
                              ? 'border border-red-100 text-red-700 hover:bg-red-50'
                              : 'border border-primary-200 text-primary-700 hover:bg-primary-50'
                          }`}
                        >
                          {sub.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <SubChildDetailModal
        isOpen={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        subId={detailId}
        fetchOne={fetchOne}
        busyId={busyId}
        onToggleActive={async (sub, next) => {
          if (!next) {
            setConfirm({ open: true, sub, nextActive: false })
            return
          }
          await runToggle(sub, true)
        }}
      />

      <ConfirmDialog
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false, sub: null, nextActive: false })}
        onConfirm={() => confirm.sub && runToggle(confirm.sub, confirm.nextActive)}
        title="Deactivate sub-child?"
        message={`${confirm.sub?.name || 'This agent'} will not be able to sign in until the account is activated again.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        variant="danger"
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
