import { useEffect, useState } from 'react'
import { User, Lock, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getProfile, updateProfile, changePassword } from '@/travelAgency/parentAgency/services/parentAgencyApi.js'
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
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileErrors, setProfileErrors] = useState({})
  const [kyc, setKyc] = useState(user?.kyc || null)

  useEffect(() => {
    getProfile().then(({ data }) => {
      const u = data?.data?.user
      if (u?.kyc) setKyc(u.kyc)
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
      const res = await updateProfile({ name: profile.name, email: profile.email, phone: profile.phone })
      const updated = res.data?.data?.user
      if (updated) setUser({ name: updated.name, email: updated.email, phone: updated.phone })
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

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your profile and account security</p>
      </div>

      {/* Profile + Password side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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

            {/* KYC Documents */}
            {kyc && (
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-700">KYC Documents</p>
                  {(() => {
                    const status = user?.kyc?.status || 'pending'
                    const map = {
                      approved: { icon: CheckCircle, label: 'KYC Approved', cls: 'bg-green-50 border-green-200 text-green-700' },
                      pending:  { icon: Clock,        label: 'KYC Pending',  cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                      rejected: { icon: XCircle,      label: 'KYC Rejected', cls: 'bg-red-50 border-red-200 text-red-700' },
                    }
                    const { icon: Icon, label, cls } = map[status] || map.pending
                    return (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
                        <Icon size={11} />
                        {label}
                        {status === 'rejected' && user?.kyc?.rejectionReason && (
                          <span className="ml-0.5 font-normal">— {user.kyc.rejectionReason}</span>
                        )}
                      </span>
                    )
                  })()}
                </div>
                <KycDocumentsSection kyc={kyc} />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? 'Saving…' : 'Save Profile'}
              </Button>
            </div>
          </form>
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
