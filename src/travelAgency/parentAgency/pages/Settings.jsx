import { useEffect, useState } from 'react'
import { User, Lock, CheckCircle, Clock, XCircle, Building2, MapPin, UserCircle2 } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getProfile, updateProfile, changePassword, updateKyc } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import KycDocumentsSection from '@/travelAgency/shared/components/KycDocumentsSection.jsx'

export default function Settings() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()

  // Profile form
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gstNumber: user?.gstNumber || '',
    address: user?.address || '',
    contactPersonName: user?.contactPersonName || '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileErrors, setProfileErrors] = useState({})
  const [kyc, setKyc] = useState(user?.kyc || null)

  useEffect(() => {
    getProfile().then(({ data }) => {
      const u = data?.data?.user
      if (u?.kyc) setKyc(u.kyc)
      if (u) {
        setProfile((p) => ({
          ...p,
          name: u.name ?? p.name,
          email: u.email ?? p.email,
          phone: u.phone ?? p.phone,
          gstNumber: u.gstNumber ?? '',
          address: u.address ?? '',
          contactPersonName: u.contactPersonName ?? '',
        }))
      }
    }).catch(() => {})
  }, [])

  // Password form
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdErrors, setPwdErrors] = useState({})

  const setP = (k, v) => { setProfile(f => ({ ...f, [k]: v })); setProfileErrors(e => ({ ...e, [k]: '' })) }
  const setPw = (k, v) => { setPwd(f => ({ ...f, [k]: v })); setPwdErrors(e => ({ ...e, [k]: '' })) }

  // Profile validation
  const validateProfile = () => {
    const errs = {}
    if (!profile.name.trim()) errs.name = 'Name is required'
    if (!profile.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errs.email = 'Invalid email'
    if (profile.phone && !/^\d{10}$/.test(profile.phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid 10-digit phone'
    return errs
  }

  // Password validation
  const validatePwd = () => {
    const errs = {}
    if (!pwd.currentPassword) errs.currentPassword = 'Current password is required'
    if (!pwd.newPassword) errs.newPassword = 'New password is required'
    else if (pwd.newPassword.length < 6) errs.newPassword = 'Minimum 6 characters'
    if (!pwd.confirmPassword) errs.confirmPassword = 'Please confirm your password'
    else if (pwd.newPassword !== pwd.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (pwd.currentPassword && pwd.newPassword && pwd.currentPassword === pwd.newPassword)
      errs.newPassword = 'New password must differ from current'
    return errs
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    const errs = validateProfile()
    if (Object.keys(errs).length) { setProfileErrors(errs); return }
    setProfileLoading(true)
    try {
      const res = await updateProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        gstNumber: profile.gstNumber,
        address: profile.address,
        contactPersonName: profile.contactPersonName,
      })
      const updated = res.data?.data?.user
      if (updated) {
        setUser({
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          gstNumber: updated.gstNumber,
          address: updated.address,
          contactPersonName: updated.contactPersonName,
          kyc: updated.kyc,
        })
      }
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const errs = validatePwd()
    if (Object.keys(errs).length) { setPwdErrors(errs); return }
    setPwdLoading(true)
    try {
      await changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword })
      toast.success('Password changed successfully')
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setPwdLoading(false)
    }
  }

  const [kycUpdating, setKycUpdating] = useState(false)
  const [showKycReverificationSent, setShowKycReverificationSent] = useState(false)

  const handleKycUpdate = async (formData) => {
    setKycUpdating(true)
    try {
      const { data } = await updateKyc(formData)
      const nextKyc = data?.data?.kyc ?? data?.data?.user?.kyc
      const updatedUser = data?.data?.user
      if (nextKyc) {
        setKyc(nextKyc)
        setUser((prev) => (prev ? { ...prev, kyc: nextKyc } : prev))
      } else if (updatedUser) {
        setKyc(updatedUser.kyc ?? null)
        setUser(updatedUser)
      }
      const serverMsg = typeof data?.message === 'string' ? data.message.trim() : ''
      toast.success(
        serverMsg ||
          'Your documents were sent for re-verification. KYC is now Pending until an administrator reviews them.',
        'Re-verification submitted',
      )
      setShowKycReverificationSent(true)
      return true
    } catch (err) {
      toast.error(getApiErrorMessage(err), 'Could not submit KYC')
      return false
    } finally {
      setKycUpdating(false)
    }
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Profile, business details, KYC, and account security</p>
      </div>

      {/* Profile + Password side by side */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">

        {/* Profile Information */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <User size={16} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Profile Information</h2>
          </div>
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                className={`input-field ${profileErrors.name ? 'border-red-400 focus:ring-red-300' : ''}`}
                value={profile.name}
                onChange={e => setP('name', e.target.value)}
                placeholder="Your full name"
              />
              {profileErrors.name && <p className="mt-1 text-xs text-red-500">{profileErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                className={`input-field ${profileErrors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                value={profile.email}
                onChange={e => setP('email', e.target.value)}
                placeholder="your@email.com"
              />
              {profileErrors.email && <p className="mt-1 text-xs text-red-500">{profileErrors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                className={`input-field ${profileErrors.phone ? 'border-red-400 focus:ring-red-300' : ''}`}
                value={profile.phone}
                onChange={e => setP('phone', e.target.value)}
                placeholder="10-digit mobile number"
              />
              {profileErrors.phone && <p className="mt-1 text-xs text-red-500">{profileErrors.phone}</p>}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <Building2 size={16} className="text-gray-500" />
                <p className="text-sm font-semibold text-gray-800">Business details</p>
              </div>
              <p className="mb-3 text-xs text-gray-500">GST, address, and contact person (visible to your team; KYC status is set by admin after review).</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST number</label>
                  <input
                    className="input-field"
                    value={profile.gstNumber}
                    onChange={(e) => setP('gstNumber', e.target.value)}
                    placeholder="GSTIN"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
                    <UserCircle2 size={14} className="text-gray-400" />
                    Contact person name
                  </label>
                  <input
                    className="input-field"
                    value={profile.contactPersonName}
                    onChange={(e) => setP('contactPersonName', e.target.value)}
                    placeholder="Primary contact for this agency"
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
                    <MapPin size={14} className="text-gray-400" />
                    Registered address
                  </label>
                  <textarea
                    className="input-field min-h-[88px] resize-y"
                    value={profile.address}
                    onChange={(e) => setP('address', e.target.value)}
                    placeholder="Full business address"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? 'Saving…' : 'Save Profile'}
              </Button>
            </div>
          </form>

          {kyc && (
            <div className="space-y-3 border-t border-gray-100 px-6 py-4">
              {showKycReverificationSent && (kyc?.status === 'pending' || !kyc?.status) && (
                <div
                  className="rounded-lg border border-emerald-200 bg-emerald-50/95 px-3 py-3 text-sm text-emerald-950"
                  role="status"
                >
                  <p className="font-semibold text-emerald-900">Re-verification request received</p>
                  <p className="mt-1.5 leading-relaxed text-emerald-900/90">
                    Your new documents are uploaded and your KYC is now marked{' '}
                    <span className="font-semibold">Pending</span>. An administrator will review them in order.
                    You do not need to submit again unless we ask for changes.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-emerald-800/85">
                    When the review is complete, your status will update here and we will email you at{' '}
                    <span className="font-medium">{profile.email || user?.email || 'your account email'}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowKycReverificationSent(false)}
                    className="mt-2.5 text-xs font-semibold text-emerald-800 underline decoration-emerald-600/40 hover:text-emerald-950"
                  >
                    Dismiss this notice
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">KYC verification</p>
                {(() => {
                  const status = kyc?.status || 'pending'
                  const map = {
                    approved: {
                      icon: CheckCircle,
                      label: 'Approved',
                      cls: 'bg-green-50 border-green-200 text-green-800',
                    },
                    pending: {
                      icon: Clock,
                      label: 'Pending review',
                      cls: 'bg-amber-50 border-amber-200 text-amber-900',
                    },
                    rejected: {
                      icon: XCircle,
                      label: 'Rejected',
                      cls: 'bg-red-50 border-red-200 text-red-800',
                    },
                  }
                  const { icon: Icon, label, cls } = map[status] || map.pending
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
                    >
                      <Icon size={12} strokeWidth={2} />
                      {label}
                    </span>
                  )
                })()}
              </div>

              {kyc?.status === 'rejected' && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50/95 px-3 py-3 text-sm text-red-950"
                  role="alert"
                >
                  <p className="font-semibold text-red-900">Your KYC was not approved</p>
                  <p className="mt-1.5 leading-relaxed text-red-900/90">
                    Please read the reviewer&apos;s notes below, prepare corrected documents (clear scans, matching
                    details), then use <span className="font-semibold">Replace Documents</span> to upload again.
                    After you submit, your request returns to <span className="font-semibold">Pending</span> for a new
                    review.
                  </p>
                  <div className="mt-3 rounded-md border border-red-200/80 bg-white/80 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-800/90">
                      Reason from reviewer
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-red-950">
                      {typeof kyc.rejectionReason === 'string' && kyc.rejectionReason.trim()
                        ? kyc.rejectionReason.trim()
                        : 'No specific reason was provided. Please re-check that IDs are readable, not expired, and match your business profile, then upload again.'}
                    </p>
                  </div>
                </div>
              )}

              {kyc?.status === 'pending' && !showKycReverificationSent && (
                <div className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-3 text-sm text-amber-950">
                  <p className="font-semibold text-amber-950">KYC is pending review</p>
                  <p className="mt-1.5 leading-relaxed text-amber-900/95">
                    Your documents are in the review queue. A team member will verify them as soon as possible. While
                    status is <span className="font-semibold">Pending</span>, you can still replace files using{' '}
                    <span className="font-semibold">Replace Documents</span> if you notice a mistake.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-amber-900/85">
                    You will be notified by email when your KYC is approved or if more action is required.
                  </p>
                </div>
              )}

              {kyc?.status === 'pending' && showKycReverificationSent && (
                <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
                  <span className="font-semibold">While you wait:</span> your KYC stays{' '}
                  <span className="font-semibold">Pending</span> until reviewed. Use Replace Documents only if you need
                  to fix an upload.
                </div>
              )}

              {kyc?.status === 'approved' && (
                <p className="text-xs leading-relaxed text-gray-600">
                  Your KYC is approved. Keep your business details up to date in the form above. Replace Documents is
                  available if you ever need to refresh files per policy.
                </p>
              )}

              <KycDocumentsSection
                kyc={kyc}
                onUpdateKyc={handleKycUpdate}
                loadingUpdate={kycUpdating}
                onEditOpen={() => setShowKycReverificationSent(false)}
              />
            </div>
          )}
        </div>
        {/* Change Password */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <Lock size={16} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
              <input
                type="password"
                className={`input-field ${pwdErrors.currentPassword ? 'border-red-400 focus:ring-red-300' : ''}`}
                value={pwd.currentPassword}
                onChange={e => setPw('currentPassword', e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              {pwdErrors.currentPassword && <p className="mt-1 text-xs text-red-500">{pwdErrors.currentPassword}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
              <input
                type="password"
                className={`input-field ${pwdErrors.newPassword ? 'border-red-400 focus:ring-red-300' : ''}`}
                value={pwd.newPassword}
                onChange={e => setPw('newPassword', e.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />
              {pwdErrors.newPassword && <p className="mt-1 text-xs text-red-500">{pwdErrors.newPassword}</p>}
              {pwd.newPassword && (
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4].map(i => {
                    const len = pwd.newPassword.length
                    const hasUpper = /[A-Z]/.test(pwd.newPassword)
                    const hasNum = /\d/.test(pwd.newPassword)
                    const hasSpecial = /[^A-Za-z0-9]/.test(pwd.newPassword)
                    const score = [len >= 6, len >= 10, hasUpper || hasNum, hasSpecial].filter(Boolean).length
                    const colors = ['bg-red-400','bg-orange-400','bg-yellow-400','bg-green-500']
                    return <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? colors[score-1] : 'bg-gray-200'}`} />
                  })}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label>
              <input
                type="password"
                className={`input-field ${pwdErrors.confirmPassword ? 'border-red-400 focus:ring-red-300' : ''}`}
                value={pwd.confirmPassword}
                onChange={e => setPw('confirmPassword', e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
              {pwdErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{pwdErrors.confirmPassword}</p>}
              {pwd.confirmPassword && pwd.newPassword === pwd.confirmPassword && !pwdErrors.confirmPassword && (
                <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle size={11} /> Passwords match</p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={pwdLoading}>
                {pwdLoading ? 'Changing…' : 'Change Password'}
              </Button>
            </div>
          </form>
        </div>

      </div>

    </div>
  )
}
