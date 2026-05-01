import { useEffect, useState } from 'react'
import { Loader2, Shield, User, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import {
  addParent,
  changeSubChildPassword,
  getSubChildProfile,
  listParents,
  toggleParentActive,
  updateSubChildProfile,
  updateSubChildKyc,
} from '@/travelAgency/subChild/services/subChildApi.js'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import ParentManagement from '@/travelAgency/shared/components/ParentManagement.jsx'
import KycDocumentsSection from '@/travelAgency/shared/components/KycDocumentsSection.jsx'

function errMessage(err) {
  const data = err?.response?.data
  if (Array.isArray(data?.errors) && data.errors.length) return data.errors.join(', ')
  return data?.message || 'Something went wrong'
}

export default function Settings() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [kycStatus, setKycStatus] = useState(null)
  const [kyc, setKyc] = useState(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        setLoadingProfile(true)
        try {
          const { data } = await getSubChildProfile()
          const u = data?.data?.user
          if (!cancelled && u) {
            setName(u.name || '')
            setEmail(u.email || '')
            setPhone(u.phone || '')
            setKycStatus(u.kyc?.status || u.kycStatus || null)
            if (u.kyc) setKyc(u.kyc)
          }
        } catch {
          if (!cancelled) {
            setName(user?.name || '')
            setEmail(user?.email || '')
            setPhone(user?.phone || '')
            setKycStatus(user?.kyc?.status || null)
          }
        } finally {
          if (!cancelled) setLoadingProfile(false)
        }
      })()
    return () => {
      cancelled = true
    }
  }, [user?.name, user?.email, user?.phone])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Name is required')
    setProfileSaving(true)
    try {
      const { data } = await updateSubChildProfile({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null })
      const u = data?.data?.user
      if (u) setUser({ name: u.name, email: u.email || '', phone: u.phone || '' })
      toast.success(data?.message || 'Profile updated')
    } catch (err) {
      toast.error(errMessage(err))
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!currentPassword) return toast.error('Enter your current password')
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters')
    if (newPassword !== confirmPassword) return toast.error('Password confirmation does not match')
    setPasswordSaving(true)
    try {
      const { data } = await changeSubChildPassword({ currentPassword, newPassword, confirmPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
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
      const { data } = await updateSubChildKyc(formData)
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

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">Manage your profile and account security</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
            <User size={16} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Profile Information</h2>
          </div>
          {loadingProfile ? (
            <div className="flex items-center gap-2 px-6 py-8 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading profile...
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  className="input-field w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  className="input-field w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  className="input-field w-full"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              {kycStatus && (() => {
                const map = {
                  approved: { icon: CheckCircle, label: 'KYC Approved', cls: 'bg-green-50 border-green-200 text-green-700' },
                  pending: { icon: Clock, label: 'KYC Pending', cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                  rejected: { icon: XCircle, label: 'KYC Rejected', cls: 'bg-red-50 border-red-200 text-red-700' },
                }
                const { icon: Icon, label, cls } = map[kycStatus] || map.pending
                return (
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-700">KYC Documents</p>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
                        <Icon size={11} /> {label}
                      </span>
                    </div>
                    <KycDocumentsSection kyc={kyc} onUpdateKyc={handleKycUpdate} loadingUpdate={kycUpdating} />
                  </div>
                )
              })()}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save Profile'}</Button>
              </div>
            </form>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
            <Shield size={16} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Current Password *</label>
              <input
                type="password"
                className="input-field w-full"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">New Password *</label>
              <input
                type="password"
                className="input-field w-full"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Confirm New Password *</label>
              <input
                type="password"
                className="input-field w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={passwordSaving}>{passwordSaving ? 'Changing...' : 'Change Password'}</Button>
            </div>
          </form>
        </div>
      </div>

      <ParentManagement
        listParents={listParents}
        addParent={addParent}
        toggleParentActive={toggleParentActive}
        label="Parent child agencies"
      />
    </div>
  )
}
