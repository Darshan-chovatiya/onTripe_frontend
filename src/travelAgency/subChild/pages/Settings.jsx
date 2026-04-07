import { useEffect, useState } from 'react'
import { Loader2, Shield, User, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import {
  changeSubChildPassword,
  getSubChildProfile,
  updateSubChildProfile,
} from '@/travelAgency/subChild/services/subChildApi.js'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'

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
  const [profileSaving, setProfileSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingProfile(true)
      try {
        const { data } = await getSubChildProfile()
        const u = data?.data?.user
        if (!cancelled && u) {
          setName(u.name || '')
          setEmail(u.email || '')
          setPhone(u.phone || '')
          setKycStatus(u.kyc?.status || u.kycStatus || null)
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

  return (
    <div className="animate-fade-in mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your sub-child account profile and password.</p>
      </header>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700"><User className="h-5 w-5" /></div>
            <h2 className="text-lg font-semibold text-gray-900">Update profile</h2>
          </div>
          {loadingProfile ? <div className="flex items-center gap-2 py-8 text-sm text-gray-500"><Loader2 className="h-5 w-5 animate-spin" />Loading profile…</div> : (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <input className="input-field w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              <input type="email" className="input-field w-full" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
              <input className="input-field w-full" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />

              {/* KYC Status */}
              {kycStatus && (() => {
                const map = {
                  approved: { icon: CheckCircle, label: 'KYC Approved',  cls: 'bg-green-50 border-green-200 text-green-700' },
                  pending:  { icon: Clock,        label: 'KYC Pending',   cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                  rejected: { icon: XCircle,      label: 'KYC Rejected',  cls: 'bg-red-50 border-red-200 text-red-700' },
                }
                const { icon: Icon, label, cls } = map[kycStatus] || map.pending
                return (
                  <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${cls}`}>
                    <Icon size={15} /> {label}
                  </div>
                )
              })()}

              <Button type="submit" disabled={profileSaving}>{profileSaving ? 'Saving…' : 'Save profile'}</Button>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800"><Shield className="h-5 w-5" /></div>
            <h2 className="text-lg font-semibold text-gray-900">Change password</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input type="password" className="input-field w-full" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" />
            <input type="password" className="input-field w-full" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
            <input type="password" className="input-field w-full" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            <Button type="submit" variant="secondary" disabled={passwordSaving}>{passwordSaving ? 'Updating…' : 'Change password'}</Button>
          </form>
        </section>
      </div>
    </div>
  )
}
