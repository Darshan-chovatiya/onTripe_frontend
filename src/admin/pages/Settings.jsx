import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { updateAdminUser } from '@/admin/services/adminApi.js'
import Button from '@/shared/components/Button.jsx'

const labelCls = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500'
const hintCls = 'mt-1 text-xs text-gray-400'
const errCls = 'mt-1 text-xs text-red-600'

export default function Settings() {
  const { toast } = useToast()
  const { user, setUser } = useAuth()
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileData, setProfileData] = useState({ name: '', email: '', mobile: '' })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.phone || user.mobile || '',
      })
    }
  }, [user])

  const validateProfile = () => {
    const errors = {}
    if (!profileData.name.trim()) errors.name = 'Name is required'
    if (!profileData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) errors.email = 'Invalid email'
    if (!profileData.mobile.trim()) errors.mobile = 'Mobile is required'
    else if (!/^\d{10}$/.test(profileData.mobile)) errors.mobile = 'Use exactly 10 digits'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePasswordField = (field, value) => {
    const errors = { ...formErrors }
    if (field === 'currentPassword') {
      if (!value) errors.currentPassword = 'Current password is required'
      else delete errors.currentPassword
    }
    if (field === 'newPassword') {
      if (!value) errors.newPassword = 'New password is required'
      else if (value.length < 6) errors.newPassword = 'Password must be at least 6 characters'
      else {
        delete errors.newPassword
        if (passwordData.confirmPassword && value !== passwordData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match'
        } else if (passwordData.confirmPassword && value === passwordData.confirmPassword) {
          delete errors.confirmPassword
        }
      }
    }
    if (field === 'confirmPassword') {
      if (!value) errors.confirmPassword = 'Please confirm your password'
      else if (passwordData.newPassword && value !== passwordData.newPassword) {
        errors.confirmPassword = 'Passwords do not match'
      } else delete errors.confirmPassword
    }
    setFormErrors(errors)
  }

  const validatePassword = () => {
    const errors = {}
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required'
    if (!passwordData.newPassword) errors.newPassword = 'New password is required'
    else if (passwordData.newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters'
    if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Passwords do not match'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!validateProfile() || !user?.id) return

    setSavingProfile(true)
    try {
      const payload = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.mobile,
      }

      const response = await updateAdminUser(user.id, payload)
      if (response?.data?.success) {
        toast.success('Profile updated')
        const updatedUser = response.data.data.user
        setUser({ ...user, ...updatedUser, mobile: updatedUser.phone })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!validatePassword()) return

    setSavingPassword(true)
    try {
      const response = await axiosInstance.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      })
      if (response.data.success) {
        toast.success('Password updated')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setFormErrors({})
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password'
      toast.error(errorMessage)
      if (
        errorMessage.toLowerCase().includes('current password') ||
        errorMessage.toLowerCase().includes('incorrect') ||
        error.response?.status === 400
      ) {
        setFormErrors((prev) => ({ ...prev, currentPassword: 'Current password is incorrect' }))
      }
    } finally {
      setSavingPassword(false)
    }
  }

  const pwInputClass = (errKey) =>
    `input-field min-w-0 w-full max-w-full pr-10 [overflow-wrap:anywhere] ${formErrors[errKey] ? 'border-red-500 focus:border-red-500' : ''}`

  const cardShell =
    'flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white'

  return (
    <div className="animate-fade-in min-w-0 space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Update your profile and password for this console.</p>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch">
        <section className={cardShell}>
          <div className="min-w-0 border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="text-sm font-medium text-gray-900">Profile</h2>
            <p className="mt-0.5 text-xs text-gray-400">Name and phone shown in the console.</p>
          </div>
          <form onSubmit={handleUpdateProfile} className="flex min-h-0 flex-1 flex-col space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              <div className="min-w-0">
                <label htmlFor="admin-name" className={labelCls}>
                  Full name <span className="text-red-500 normal-case">*</span>
                </label>
                <input
                  id="admin-name"
                  type="text"
                  className={`input-field min-w-0 w-full max-w-full ${formErrors.name ? 'border-red-500' : ''}`}
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  autoComplete="name"
                />
                {formErrors.name ? <p className={errCls}>{formErrors.name}</p> : null}
              </div>

              <div className="min-w-0">
                <label htmlFor="admin-email" className={labelCls}>Email</label>
                <input
                  id="admin-email"
                  type="email"
                  readOnly
                  className="input-field min-w-0 w-full max-w-full cursor-not-allowed border-gray-200 bg-gray-50/80 text-gray-600 [overflow-wrap:anywhere]"
                  value={profileData.email}
                />
                <p className={hintCls}>Read-only. Support can change the login email if needed.</p>
              </div>

              <div className="min-w-0">
                <label htmlFor="admin-mobile" className={labelCls}>
                  Mobile <span className="text-red-500 normal-case">*</span>
                </label>
                <input
                  id="admin-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className={`input-field min-w-0 w-full max-w-full ${formErrors.mobile ? 'border-red-500' : ''}`}
                  value={profileData.mobile}
                  onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value.replace(/\D/g, '') })}
                  autoComplete="tel"
                  placeholder="10 digits"
                />
                {formErrors.mobile ? <p className={errCls}>{formErrors.mobile}</p> : null}
              </div>

              <div className="pt-1">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Saving…' : 'Save'}
                </Button>
              </div>
          </form>
        </section>

        <section className={cardShell}>
          <div className="min-w-0 border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="text-sm font-medium text-gray-900">Password</h2>
            <p className="mt-0.5 text-xs text-gray-400">Use a password you do not reuse elsewhere.</p>
          </div>
          <form onSubmit={handleChangePassword} className="flex min-h-0 flex-1 flex-col space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              <div className="min-w-0">
                <label htmlFor="admin-cur-pw" className={labelCls}>
                  Current <span className="text-red-500 normal-case">*</span>
                </label>
                <div className="relative min-w-0">
                  <input
                    id="admin-cur-pw"
                    type={showPasswords.current ? 'text' : 'password'}
                    className={pwInputClass('currentPassword')}
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      validatePasswordField('currentPassword', e.target.value)
                    }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 z-[1] -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                    onClick={() => setShowPasswords((s) => ({ ...s, current: !s.current }))}
                    aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                  </button>
                </div>
                {formErrors.currentPassword ? <p className={errCls}>{formErrors.currentPassword}</p> : null}
              </div>

              <div className="min-w-0">
                <label htmlFor="admin-new-pw" className={labelCls}>
                  New <span className="text-red-500 normal-case">*</span>
                </label>
                <div className="relative min-w-0">
                  <input
                    id="admin-new-pw"
                    type={showPasswords.new ? 'text' : 'password'}
                    className={pwInputClass('newPassword')}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                      validatePasswordField('newPassword', e.target.value)
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 z-[1] -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                    onClick={() => setShowPasswords((s) => ({ ...s, new: !s.new }))}
                    aria-label={showPasswords.new ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                  </button>
                </div>
                <p className={hintCls}>Minimum 6 characters.</p>
                {formErrors.newPassword ? <p className={errCls}>{formErrors.newPassword}</p> : null}
              </div>

              <div className="min-w-0">
                <label htmlFor="admin-confirm-pw" className={labelCls}>
                  Confirm new <span className="text-red-500 normal-case">*</span>
                </label>
                <div className="relative min-w-0">
                  <input
                    id="admin-confirm-pw"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    className={pwInputClass('confirmPassword')}
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      validatePasswordField('confirmPassword', e.target.value)
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 z-[1] -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                    onClick={() => setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))}
                    aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
                  </button>
                </div>
                {formErrors.confirmPassword ? <p className={errCls}>{formErrors.confirmPassword}</p> : null}
              </div>

              <div className="pt-1">
                <Button type="submit" variant="secondary" disabled={savingPassword}>
                  {savingPassword ? 'Updating…' : 'Update password'}
                </Button>
              </div>
          </form>
        </section>
      </div>
    </div>
  )
}
