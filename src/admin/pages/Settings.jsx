import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, User, Lock, Mail, Phone, ShieldCheck, CheckCircle, Camera, X } from 'lucide-react'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { updateAdminUser, uploadAdminProfileImage } from '@/admin/services/adminApi.js'

function PasswordStrength({ password }) {
  if (!password) return null
  const checks = [password.length >= 6, password.length >= 10, /[A-Z]/.test(password) || /\d/.test(password), /[^A-Za-z0-9]/.test(password)]
  const score = checks.filter(Boolean).length
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500']
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score-1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-[11px] font-semibold ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-orange-500' : score === 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>
        {labels[score - 1] || 'Too short'}
      </p>
    </div>
  )
}

function Field({ label, error, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function PwInput({ id, value, onChange, show, onToggle, placeholder, autoComplete }) {
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        className="input-field w-full pr-10" />
      <button type="button" onClick={onToggle}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
      </button>
    </div>
  )
}

export default function Settings() {
  const { toast } = useToast()
  const { user, setUser } = useAuth()
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [profileData, setProfileData] = useState({ name: '', email: '', mobile: '' })
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [errors, setErrors] = useState({})
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || '', email: user.email || '', mobile: user.phone || user.mobile || '' })
      if (user.profileImage) setPreviewUrl(`${API_BASE}/${user.profileImage}`)
    }
  }, [user])

  const initials = (profileData.name || 'A').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    // Local preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setUploadingImage(true)
    try {
      const res = await uploadAdminProfileImage(user.id, file)
      if (res?.data?.success) {
        setUser({ ...user, profileImage: res.data.data.profileImage })
        toast.success('Profile picture updated')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not upload image')
      setPreviewUrl(user?.profileImage ? `${API_BASE}/${user.profileImage}` : null)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!user?.id) return
    setPreviewUrl(null)
    try {
      await updateAdminUser(user.id, { profileImage: '' })
      setUser({ ...user, profileImage: '' })
      toast.success('Profile picture removed')
    } catch {
      toast.error('Could not remove image')
    }
  }

  const validateProfile = () => {
    const e = {}
    if (!profileData.name.trim()) e.name = 'Name is required'
    if (!profileData.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) e.email = 'Invalid email'
    if (!profileData.mobile.trim()) e.mobile = 'Mobile is required'
    else if (!/^\d{10}$/.test(profileData.mobile)) e.mobile = 'Exactly 10 digits required'
    setErrors(e); return !Object.keys(e).length
  }

  const validatePassword = () => {
    const e = {}
    if (!passwordData.currentPassword) e.currentPassword = 'Required'
    if (!passwordData.newPassword) e.newPassword = 'Required'
    else if (passwordData.newPassword.length < 6) e.newPassword = 'Minimum 6 characters'
    if (passwordData.newPassword !== passwordData.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e); return !Object.keys(e).length
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!validateProfile() || !user?.id) return
    setSavingProfile(true)
    try {
      const res = await updateAdminUser(user.id, { name: profileData.name, email: profileData.email, phone: profileData.mobile })
      if (res?.data?.success) {
        toast.success('Profile updated')
        const u = res.data.data.user
        setUser({ ...user, ...u, mobile: u.phone })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile')
    } finally { setSavingProfile(false) }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!validatePassword()) return
    setSavingPassword(true)
    try {
      const res = await axiosInstance.put('/auth/change-password', passwordData)
      if (res.data.success) {
        toast.success('Password updated successfully')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setErrors({})
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password'
      toast.error(msg)
      if (msg.toLowerCase().includes('current') || err.response?.status === 400)
        setErrors(prev => ({ ...prev, currentPassword: 'Current password is incorrect' }))
    } finally { setSavingPassword(false) }
  }

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-primary-950 to-primary-900 p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="relative flex items-center gap-5">
          {/* Avatar with upload overlay */}
          <div className="relative shrink-0">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-2xl font-black text-white shadow-lg backdrop-blur-sm ring-2 ring-white/20">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {/* Upload button */}
            {/* <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-gray-100 disabled:opacity-60"
              title="Change photo"
            >
              {uploadingImage
                ? <div className="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-gray-700" />
                : <Camera className="h-3 w-3 text-gray-700" strokeWidth={2.5} />
              }
            </button> */}
            {/* Remove button */}
            {previewUrl && !uploadingImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 shadow-md transition hover:bg-red-600"
                title="Remove photo"
              >
                <X className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">Administrator</p>
            <h1 className="text-xl font-black text-white">{profileData.name || 'Admin'}</h1>
            <p className="mt-0.5 text-sm text-white/60">{profileData.email}</p>
            {/* <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/25"
            >
              <Camera className="h-3 w-3" strokeWidth={2.5} />
              {previewUrl ? 'Change photo' : 'Add photo'}
            </button> */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Profile card */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
              <User className="h-4 w-4 text-primary-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Profile</h2>
              <p className="text-[11px] text-gray-400">Name and contact details</p>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-5 p-6">
            <Field label="Full name *" error={errors.name}>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                <input type="text" value={profileData.name} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))}
                  className="input-field w-full pl-9" placeholder="Your full name" autoComplete="name" />
              </div>
            </Field>
            <Field label="Email" hint="Read-only. Contact support to change.">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                <input type="email" readOnly value={profileData.email}
                  className="input-field w-full cursor-not-allowed bg-gray-50 pl-9 text-gray-500" />
              </div>
            </Field>
            <Field label="Mobile *" error={errors.mobile}>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
                <input type="tel" inputMode="numeric" maxLength={10} value={profileData.mobile}
                  onChange={e => setProfileData(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '') }))}
                  className="input-field w-full pl-9" placeholder="10-digit number" autoComplete="tel" />
              </div>
            </Field>
            <button type="submit" disabled={savingProfile}
              className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60">
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </section>

        {/* Password card */}
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Lock className="h-4 w-4 text-amber-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Password</h2>
              <p className="text-[11px] text-gray-400">Keep your account secure</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-5 p-6">
            <Field label="Current password *" error={errors.currentPassword}>
              <PwInput id="cur-pw" value={passwordData.currentPassword}
                onChange={e => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                show={show.current} onToggle={() => setShow(s => ({ ...s, current: !s.current }))}
                placeholder="Enter current password" autoComplete="current-password" />
            </Field>
            <Field label="New password *" error={errors.newPassword}>
              <PwInput id="new-pw" value={passwordData.newPassword}
                onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                show={show.new} onToggle={() => setShow(s => ({ ...s, new: !s.new }))}
                placeholder="Minimum 6 characters" autoComplete="new-password" />
              <PasswordStrength password={passwordData.newPassword} />
            </Field>
            <Field label="Confirm new password *" error={errors.confirmPassword}>
              <PwInput id="confirm-pw" value={passwordData.confirmPassword}
                onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                show={show.confirm} onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                placeholder="Re-enter new password" autoComplete="new-password" />
              {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && !errors.confirmPassword && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.5} /> Passwords match
                </p>
              )}
            </Field>
            <button type="submit" disabled={savingPassword}
              className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60">
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
