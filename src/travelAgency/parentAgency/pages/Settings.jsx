import { useEffect, useRef, useState } from 'react'
import { User, Lock, CheckCircle, Camera, Upload } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getProfile, updateProfile, changePassword, updateKyc } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import KycDocumentsSection from '@/travelAgency/shared/components/KycDocumentsSection.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const logoUrl = (path) => path ? (path.startsWith('http') ? path : `${API_BASE}/${String(path).replace(/^\//, '')}`) : null

export default function Settings() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const logoInputRef = useRef(null)

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gstNumber: user?.gstNumber || '',
    address: user?.address || '',
    contactPersonName: user?.contactPersonName || '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileErrors, setProfileErrors] = useState({})
  const [kyc, setKyc] = useState(user?.kyc || null)
  const [existingLogo, setExistingLogo] = useState(user?.agencyLogo || null)

  useEffect(() => {
    getProfile().then(({ data }) => {
      const u = data?.data?.user
      if (u?.kyc) setKyc(u.kyc)
      if (u) {
        setProfile(p => ({
          ...p,
          name: u.name ?? p.name,
          email: u.email ?? p.email,
          phone: u.phone ?? p.phone,
          gstNumber: u.gstNumber ?? p.gstNumber,
          address: u.address ?? p.address,
          contactPersonName: u.contactPersonName ?? p.contactPersonName,
        }))
        if (u.agencyLogo) setExistingLogo(u.agencyLogo)
      }
    }).catch(() => {})
  }, [])

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdErrors, setPwdErrors] = useState({})

  const setP = (k, v) => { setProfile(f => ({ ...f, [k]: v })); setProfileErrors(e => ({ ...e, [k]: '' })) }
  const setPw = (k, v) => { setPwd(f => ({ ...f, [k]: v })); setPwdErrors(e => ({ ...e, [k]: '' })) }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const validateProfile = () => {
    const errs = {}
    if (!profile.name.trim()) errs.name = 'Name is required'
    if (!profile.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errs.email = 'Invalid email'
    if (profile.phone && !/^\d{10}$/.test(profile.phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid 10-digit phone'
    return errs
  }

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
      const fd = new FormData()
      fd.append('name', profile.name)
      fd.append('email', profile.email)
      fd.append('phone', profile.phone)
      fd.append('gstNumber', profile.gstNumber)
      fd.append('address', profile.address)
      fd.append('contactPersonName', profile.contactPersonName)
      if (logoFile) fd.append('agencyLogo', logoFile)

      const res = await updateProfile(fd)
      const updated = res.data?.data?.user
      if (updated) {
        setUser(prev => ({ 
          ...prev, 
          name: updated.name, 
          email: updated.email, 
          phone: updated.phone, 
          gstNumber: updated.gstNumber,
          address: updated.address,
          contactPersonName: updated.contactPersonName,
          agencyLogo: updated.agencyLogo, 
          kyc: updated.kyc 
        }))
        if (updated.agencyLogo) { setExistingLogo(updated.agencyLogo); setLogoFile(null); setLogoPreview(null) }
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
      if (nextKyc) { setKyc(nextKyc); setUser(prev => prev ? { ...prev, kyc: nextKyc } : prev) }
      else if (updatedUser) { setKyc(updatedUser.kyc ?? null); setUser(updatedUser) }
      toast.success(typeof data?.message === 'string' ? data.message.trim() : 'Re-verification submitted')
      setShowKycReverificationSent(true)
      return true
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      return false
    } finally {
      setKycUpdating(false)
    }
  }

  const currentLogoUrl = logoPreview || logoUrl(existingLogo)
  const initials = (profile.name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="w-full space-y-6 pb-8">

      {/* ── Profile header ── */}
      <div className="flex items-center gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {/* Logo / avatar */}
        <div className="relative shrink-0">
          <div className="h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
            {currentLogoUrl
              ? <img src={currentLogoUrl} alt="Agency logo" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-2xl font-black text-gray-400">{initials}</div>
            }
          </div>
          <button type="button" onClick={() => logoInputRef.current?.click()}
            className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-900 text-white shadow-sm transition hover:bg-gray-700">
            <Camera className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoChange} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Parent Agency</p>
          <h1 className="mt-0.5 text-xl font-bold text-gray-900">{profile.name || 'Agency'}</h1>
          <p className="text-sm text-gray-500">{profile.email}</p>
          {logoFile && (
            <p className="mt-1 text-[11px] text-amber-600 font-medium">Photo changed — save profile to apply</p>
          )}
        </div>

        {kyc && (() => {
          const s = kyc?.status || 'pending'
          const map = {
            approved: { label: 'KYC Verified', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            pending:  { label: 'KYC Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
            rejected: { label: 'KYC Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
          }
          const { label, cls } = map[s] || map.pending
          return <span className={`shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>
        })()}
      </div>

      {/* ── Profile + Password ── */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">

        {/* Profile form */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
              <User size={15} className="text-primary-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Profile Information</h2>
              <p className="text-[11px] text-gray-400">Name, email and phone</p>
            </div>
          </div>
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">

            {/* Profile photo upload */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Profile Photo</label>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  {currentLogoUrl
                    ? <img src={currentLogoUrl} alt="profile" className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">{initials}</div>
                  }
                </div>
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-600 transition hover:border-gray-400 hover:bg-white">
                  <Upload className="h-3.5 w-3.5" strokeWidth={2} />
                  {logoFile ? logoFile.name : existingLogo ? 'Change photo' : 'Upload photo'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Full Name *</label>
              <input className={`input-field w-full ${profileErrors.name ? 'border-red-400' : ''}`}
                value={profile.name} onChange={e => setP('name', e.target.value)} placeholder="Your full name" />
              {profileErrors.name && <p className="mt-1 text-xs font-medium text-red-500">{profileErrors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Email Address *</label>
              <input type="email" className={`input-field w-full ${profileErrors.email ? 'border-red-400' : ''}`}
                value={profile.email} onChange={e => setP('email', e.target.value)} placeholder="your@email.com" />
              {profileErrors.email && <p className="mt-1 text-xs font-medium text-red-500">{profileErrors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Phone Number</label>
              <input className={`input-field w-full ${profileErrors.phone ? 'border-red-400' : ''}`}
                value={profile.phone} onChange={e => setP('phone', e.target.value)} placeholder="10-digit mobile" />
              {profileErrors.phone && <p className="mt-1 text-xs font-medium text-red-500">{profileErrors.phone}</p>}
            </div>

            <div className="pt-2 border-t border-gray-50">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary-600 mb-4">Business Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">GST Number</label>
                  <input className="input-field w-full"
                    value={profile.gstNumber} onChange={e => setP('gstNumber', e.target.value)} placeholder="22AAAAA0000A1Z5" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Contact Person Name</label>
                  <input className="input-field w-full"
                    value={profile.contactPersonName} onChange={e => setP('contactPersonName', e.target.value)} placeholder="Full name of contact person" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Business Address</label>
                  <textarea className="input-field w-full min-h-[80px] py-2"
                    value={profile.address} onChange={e => setP('address', e.target.value)} placeholder="Complete office address" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={profileLoading}
              className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60">
              {profileLoading ? 'Saving…' : 'Save Profile'}
            </button>
          </form>

          {kyc && (
            <div className="border-t border-gray-100 px-6 py-5 space-y-4">
              {showKycReverificationSent && (kyc?.status === 'pending' || !kyc?.status) && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                  <p className="font-bold text-emerald-900">Re-verification submitted</p>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-800">KYC is now <strong>Pending</strong>. We'll email you when reviewed.</p>
                  <button type="button" onClick={() => setShowKycReverificationSent(false)} className="mt-2 text-xs font-bold text-emerald-700 underline">Dismiss</button>
                </div>
              )}
              {kyc?.status === 'rejected' && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
                  <p className="font-bold text-red-900">KYC Rejected</p>
                  <p className="mt-1 text-xs leading-relaxed text-red-800">{kyc.rejectionReason || 'Please re-upload clear, valid documents.'}</p>
                </div>
              )}
              {kyc?.status === 'pending' && !showKycReverificationSent && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                  <p className="font-bold text-amber-900">KYC under review</p>
                  <p className="mt-1 text-xs text-amber-800">You'll be notified by email once reviewed.</p>
                </div>
              )}
              <KycDocumentsSection kyc={kyc} onUpdateKyc={handleKycUpdate} loadingUpdate={kycUpdating} onEditOpen={() => setShowKycReverificationSent(false)} />
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Lock size={15} className="text-amber-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Change Password</h2>
              <p className="text-[11px] text-gray-400">Keep your account secure</p>
            </div>
          </div>
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Current Password *</label>
              <input type="password" className={`input-field w-full ${pwdErrors.currentPassword ? 'border-red-400' : ''}`}
                value={pwd.currentPassword} onChange={e => setPw('currentPassword', e.target.value)}
                placeholder="Enter current password" autoComplete="current-password" />
              {pwdErrors.currentPassword && <p className="mt-1 text-xs font-medium text-red-500">{pwdErrors.currentPassword}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">New Password *</label>
              <input type="password" className={`input-field w-full ${pwdErrors.newPassword ? 'border-red-400' : ''}`}
                value={pwd.newPassword} onChange={e => setPw('newPassword', e.target.value)}
                placeholder="Minimum 6 characters" autoComplete="new-password" />
              {pwd.newPassword && (() => {
                const checks = [pwd.newPassword.length >= 6, pwd.newPassword.length >= 10, /[A-Z]/.test(pwd.newPassword) || /\d/.test(pwd.newPassword), /[^A-Za-z0-9]/.test(pwd.newPassword)]
                const score = checks.filter(Boolean).length
                const colors = ['bg-red-400','bg-orange-400','bg-yellow-400','bg-emerald-500']
                const labels = ['Weak','Fair','Good','Strong']
                return (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">{[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= score ? colors[score-1] : 'bg-gray-200'}`} />)}</div>
                    <p className={`text-[11px] font-semibold ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-orange-500' : score === 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>{labels[score-1] || 'Too short'}</p>
                  </div>
                )
              })()}
              {pwdErrors.newPassword && <p className="mt-1 text-xs font-medium text-red-500">{pwdErrors.newPassword}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Confirm New Password *</label>
              <input type="password" className={`input-field w-full ${pwdErrors.confirmPassword ? 'border-red-400' : ''}`}
                value={pwd.confirmPassword} onChange={e => setPw('confirmPassword', e.target.value)}
                placeholder="Re-enter new password" autoComplete="new-password" />
              {pwdErrors.confirmPassword && <p className="mt-1 text-xs font-medium text-red-500">{pwdErrors.confirmPassword}</p>}
              {pwd.confirmPassword && pwd.newPassword === pwd.confirmPassword && !pwdErrors.confirmPassword && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle size={11} strokeWidth={2.5} /> Passwords match
                </p>
              )}
            </div>
            <button type="submit" disabled={pwdLoading}
              className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60">
              {pwdLoading ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
