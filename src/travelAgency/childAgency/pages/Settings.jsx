import { useEffect, useRef, useState } from 'react'
import { Loader2, Shield, User, CheckCircle, Camera, Upload } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import {
  addParent, changeChildPassword, getChildProfile,
  listParents, toggleParentActive, updateChildProfile, updateChildKyc
} from '@/travelAgency/childAgency/services/childAgencyApi.js'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import ParentManagement from '@/travelAgency/shared/components/ParentManagement.jsx'
import KycDocumentsSection from '@/travelAgency/shared/components/KycDocumentsSection.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const logoUrl = (path) => path ? (path.startsWith('http') ? path : `${API_BASE}/${String(path).replace(/^\//, '')}`) : null

function errMessage(err) {
  const data = err?.response?.data
  if (data?.errors?.length) return data.errors.join(', ')
  return data?.message || 'Something went wrong'
}

export default function Settings() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const logoInputRef = useRef(null)

  const [loadingProfile, setLoadingProfile] = useState(true)
  const [kycStatus, setKycStatus] = useState(null)
  const [kyc, setKyc] = useState(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [address, setAddress] = useState('')
  const [contactPersonName, setContactPersonName] = useState('')
  const [existingLogo, setExistingLogo] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [profileSaving, setProfileSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) return undefined
    let cancelled = false
    ;(async () => {
      setLoadingProfile(true)
      try {
        const { data } = await getChildProfile()
        const u = data?.data?.user
        if (!cancelled && u) {
          setName(u.name || '')
          setEmail(u.email || '')
          setPhone(u.phone || '')
          setGstNumber(u.gstNumber || '')
          setAddress(u.address || '')
          setContactPersonName(u.contactPersonName || '')
          setKycStatus(u.kycStatus || null)
          if (u.kyc) setKyc(u.kyc)
          if (u.agencyLogo) setExistingLogo(u.agencyLogo)
        }
      } catch {
        if (!cancelled) {
          setName(user.name || '')
          setEmail(user.email || '')
          setPhone(user.phone || '')
          toast.error('Could not load profile from server')
        }
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    })()
    return () => { cancelled = true }
  }, [user?.id])

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    const n = name.trim()
    const em = email.trim()
    const ph = phone.trim()
    if (!n) { toast.error('Name is required'); return }
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { toast.error('Enter a valid email'); return }
    if (ph && (ph.length < 5 || ph.length > 20 || !/^[\d+\s-]+$/.test(ph))) { toast.error('Enter a valid phone number'); return }

    setProfileSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', n)
      if (em) fd.append('email', em)
      if (ph) fd.append('phone', ph)
      fd.append('gstNumber', gstNumber)
      fd.append('address', address)
      fd.append('contactPersonName', contactPersonName)
      if (logoFile) fd.append('agencyLogo', logoFile)

      const { data } = await updateChildProfile(fd)
      const u = data?.data?.user
      if (u) {
        setKycStatus(u.kycStatus ?? kycStatus)
        setUser(prev => ({ 
          ...prev, 
          name: u.name, 
          email: u.email || '', 
          phone: u.phone || '', 
          gstNumber: u.gstNumber,
          address: u.address,
          contactPersonName: u.contactPersonName,
          agencyLogo: u.agencyLogo 
        }))
        if (u.agencyLogo) { setExistingLogo(u.agencyLogo); setLogoFile(null); setLogoPreview(null) }
      }
      toast.success(data?.message || 'Profile updated')
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!currentPassword) { toast.error('Enter your current password'); return }
    if (newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (newPassword === currentPassword) { toast.error('New password must be different'); return }

    setPasswordSaving(true)
    try {
      const { data } = await changeChildPassword({ currentPassword, newPassword, confirmPassword })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      toast.success(data?.message || 'Password updated')
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setPasswordSaving(false)
    }
  }

  const [kycUpdating, setKycUpdating] = useState(false)
  const handleKycUpdate = async (formData) => {
    setKycUpdating(true)
    try {
      const { data } = await updateChildKyc(formData)
      if (data?.data?.user) {
        setKyc(data.data.user.kyc)
        setKycStatus(data.data.user.kyc?.status || 'pending')
        setUser(data.data.user)
      }
      toast.success('KYC documents submitted for re-verification.')
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setKycUpdating(false)
    }
  }

  const currentLogoUrl = logoPreview || logoUrl(existingLogo)
  const initials = (name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="animate-fade-in space-y-6 pb-8">

      {/* ── Profile header ── */}
      <div className="flex items-center gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
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
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Child Agency</p>
          <h1 className="mt-0.5 text-xl font-bold text-gray-900">{name || 'Agent'}</h1>
          <p className="text-sm text-gray-500">{email}</p>
          {logoFile && <p className="mt-1 text-[11px] text-amber-600 font-medium">Photo changed — save profile to apply</p>}
        </div>

        {kycStatus && (() => {
          const map = {
            approved: { label: 'KYC Verified', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            pending:  { label: 'KYC Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
            rejected: { label: 'KYC Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
          }
          const { label, cls } = map[kycStatus] || map.pending
          return <span className={`shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>
        })()}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Profile form */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
              <User size={15} className="text-primary-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Profile Information</h2>
              <p className="text-[11px] text-gray-400">Name, email and contact</p>
            </div>
          </div>

          {loadingProfile ? (
            <div className="flex items-center gap-2 px-6 py-10 text-sm text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading profile…
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4 p-6">

              {/* Profile photo upload */}
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Agency Logo</label>
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
                <input className="input-field w-full" value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Email Address</label>
                <input type="email" className="input-field w-full" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Phone Number</label>
                <input type="tel" className="input-field w-full" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>

              <div className="pt-2 border-t border-gray-50">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary-600 mb-4">Business Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">GST Number</label>
                    <input className="input-field w-full" value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Contact Person Name</label>
                    <input className="input-field w-full" value={contactPersonName} onChange={e => setContactPersonName(e.target.value)} placeholder="Full name of contact person" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Business Address</label>
                    <textarea className="input-field w-full min-h-[80px] py-2" value={address} onChange={e => setAddress(e.target.value)} placeholder="Complete office address" />
                  </div>
                </div>
              </div>

              {kyc && (
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">KYC Documents</p>
                    {kycStatus && (() => {
                      const map = {
                        approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700' },
                        pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700' },
                        rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700' },
                      }
                      const { label, cls } = map[kycStatus] || map.pending
                      return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />{label}</span>
                    })()}
                  </div>
                  <KycDocumentsSection kyc={kyc} onUpdateKyc={handleKycUpdate} loadingUpdate={kycUpdating} />
                </div>
              )}

              <button type="submit" disabled={profileSaving}
                className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60">
                {profileSaving ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          )}
        </div>

        {/* Password */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Shield size={15} className="text-amber-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Change Password</h2>
              <p className="text-[11px] text-gray-400">Keep your account secure</p>
            </div>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 p-6">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Current Password *</label>
              <input type="password" className="input-field w-full" value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" placeholder="Enter current password" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">New Password *</label>
              <input type="password" className="input-field w-full" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" minLength={8} placeholder="Minimum 8 characters" />
              {newPassword && (() => {
                const checks = [newPassword.length >= 8, newPassword.length >= 12, /[A-Z]/.test(newPassword) || /\d/.test(newPassword), /[^A-Za-z0-9]/.test(newPassword)]
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
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Confirm New Password *</label>
              <input type="password" className="input-field w-full" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Re-enter new password" />
              {confirmPassword && newPassword === confirmPassword && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle size={11} strokeWidth={2.5} /> Passwords match
                </p>
              )}
            </div>
            <button type="submit" disabled={passwordSaving}
              className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60">
              {passwordSaving ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* <ParentManagement listParents={listParents} addParent={addParent} toggleParentActive={toggleParentActive} label="Parent agencies" /> */}
    </div>
  )
}
