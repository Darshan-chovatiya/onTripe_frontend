import { useEffect, useState } from 'react'
import { Loader2, Shield, User, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import {
  addParent,
  changeChildPassword,
  getChildProfile,
  listParents,
  toggleParentActive,
  updateChildProfile,
} from '@/travelAgency/childAgency/services/childAgencyApi.js'
import Button from '@/shared/components/Button.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import ParentManagement from '@/travelAgency/shared/components/ParentManagement.jsx'
import KycDocumentsSection from '@/travelAgency/shared/components/KycDocumentsSection.jsx'

function errMessage(err) {
  const data = /** @type {{ message?: string; errors?: string[] }} */ (err?.response?.data)
  if (data?.errors?.length) return data.errors.join(', ')
  return data?.message || 'Something went wrong'
}

const KYC_LABEL = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default function Settings() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()

  const [loadingProfile, setLoadingProfile] = useState(true)
  const [kycStatus, setKycStatus] = useState(null)
  const [kyc, setKyc] = useState(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
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
          setKycStatus(u.kycStatus || null)
          if (u.kyc) setKyc(u.kyc)
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
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    const n = name.trim()
    const em = email.trim()
    const ph = phone.trim()
    if (!n) {
      toast.error('Name is required')
      return
    }
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      toast.error('Enter a valid email or leave it empty')
      return
    }
    if (ph && (ph.length < 5 || ph.length > 20 || !/^[\d+\s-]+$/.test(ph))) {
      toast.error('Use 5–20 digits (and optional +, spaces, or hyphens) for phone')
      return
    }

    setProfileSaving(true)
    try {
      const { data } = await updateChildProfile({
        name: n,
        email: em || null,
        phone: ph || null,
      })
      const u = data?.data?.user
      if (u) {
        setKycStatus(u.kycStatus ?? kycStatus)
        setUser({
          name: u.name,
          email: u.email || '',
          phone: u.phone || '',
        })
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
    if (!currentPassword) {
      toast.error('Enter your current password')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }
    if (newPassword === currentPassword) {
      toast.error('New password must be different from the current one')
      return
    }

    setPasswordSaving(true)
    try {
      const { data } = await changeChildPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
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
        <p className="mt-1 text-sm text-gray-500">
          Update your account profile and keep your password secure. Changes apply to your child agency login
          immediately.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
      {/* Profile */}
      <section className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">Update profile</h2>
            <p className="text-xs text-gray-500">Name, email, and phone for sign-in and notifications.</p>
          </div>
        </div>

        {loadingProfile ? (
          <div className="flex items-center gap-2 py-8 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading profile…
          </div>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label htmlFor="set-name" className="mb-1 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="set-name"
                className="input-field w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="set-email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="set-email"
                type="email"
                className="input-field w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
              <p className="mt-1 text-xs text-gray-400">Used to sign in. Clear the field to remove email from your account.</p>
            </div>
            <div>
              <label htmlFor="set-phone" className="mb-1 block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                id="set-phone"
                type="tel"
                className="input-field w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+91 …"
              />
              <p className="mt-1 text-xs text-gray-400">5–20 characters: digits, spaces, hyphens, or leading +.</p>
            </div>

            {kyc && (
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-700">KYC Documents</p>
                  {kycStatus && (() => {
                    const map = {
                      approved: { icon: CheckCircle, label: 'KYC Approved', cls: 'bg-green-50 border-green-200 text-green-700' },
                      pending:  { icon: Clock,        label: 'KYC Pending',  cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                      rejected: { icon: XCircle,      label: 'KYC Rejected', cls: 'bg-red-50 border-red-200 text-red-700' },
                    }
                    const { icon: Icon, label, cls } = map[kycStatus] || map.pending
                    return (
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
                        <Icon size={11} />
                        {label}
                      </span>
                    )
                  })()}
                </div>
                <KycDocumentsSection kyc={kyc} />
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? 'Saving…' : 'Save profile'}
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Password */}
      <section className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">Change password</h2>
            <p className="text-xs text-gray-500">Use a strong password you do not reuse elsewhere.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="set-current-pw" className="mb-1 block text-sm font-medium text-gray-700">
              Current password
            </label>
            <input
              id="set-current-pw"
              type="password"
              className="input-field w-full"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="set-new-pw" className="mb-1 block text-sm font-medium text-gray-700">
              New password
            </label>
            <input
              id="set-new-pw"
              type="password"
              className="input-field w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
            <p className="mt-1 text-xs text-gray-400">At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="set-confirm-pw" className="mb-1 block text-sm font-medium text-gray-700">
              Confirm new password
            </label>
            <input
              id="set-confirm-pw"
              type="password"
              className="input-field w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="secondary" disabled={passwordSaving}>
              {passwordSaving ? 'Updating…' : 'Change password'}
            </Button>
          </div>
        </form>
      </section>
      </div>

      <ParentManagement
        listParents={listParents}
        addParent={addParent}
        toggleParentActive={toggleParentActive}
        label="Parent agencies"
      />
    </div>
  )
}
