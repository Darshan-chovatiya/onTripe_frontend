import { useState, useEffect } from 'react'
import { User, Mail, Phone, Lock, Save, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { updateAdminUser } from '@/admin/services/adminApi.js'

export default function Settings() {
  const { toast } = useToast()
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
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
        mobile: user.mobile || '',
      })
    }
  }, [user])

  const validateProfile = () => {
    const errors = {}
    if (!profileData.name.trim()) errors.name = 'Name is required'
    if (!profileData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) errors.email = 'Invalid email'
    if (!profileData.mobile.trim()) errors.mobile = 'Mobile is required'
    else if (!/^\d{10}$/.test(profileData.mobile)) errors.mobile = 'Invalid mobile number'
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

    setLoading(true)
    try {
      const response = await updateAdminUser(user.id, profileData)
      if (response.data.status === 200) {
        toast.success('Profile updated successfully')
        const next = response.data.result.user
        setUser({ ...next, role: user.role })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!validatePassword()) return

    setLoading(true)
    try {
      const response = await axiosInstance.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      })
      if (response.data.status === 200) {
        toast.success('Password changed successfully')
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
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
         <h1 className="text-2xl font-bold text-zinc-900">Account Settings</h1>
         <p className="text-gray-500 text-sm">Manage your administrative profile and security preferences</p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  setFormErrors({})
                }}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 font-medium text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="card">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="max-w-md space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                <User className="mr-2 inline h-4 w-4" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className={`input-field ${formErrors.name ? 'border-red-500' : ''}`}
              />
              {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                <Mail className="mr-2 inline h-4 w-4" />
                Email <span className="text-xs font-normal text-gray-500">(read-only)</span>
              </label>
              <input type="email" value={profileData.email} readOnly className="input-field cursor-not-allowed bg-gray-50 text-gray-600" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                <Phone className="mr-2 inline h-4 w-4" />
                Mobile <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                value={profileData.mobile}
                onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value.replace(/\D/g, '') })}
                className={`input-field ${formErrors.mobile ? 'border-red-500' : ''}`}
              />
              {formErrors.mobile && <p className="mt-1 text-xs text-red-500">{formErrors.mobile}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">Change Password</h2>
          <form onSubmit={handleChangePassword} className="max-w-md space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    validatePasswordField('currentPassword', e.target.value)
                  }}
                  className={`input-field pr-10 ${formErrors.currentPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPasswords((s) => ({ ...s, current: !s.current }))}
                >
                  {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formErrors.currentPassword && (
                <p className="mt-1 text-xs text-red-500">{formErrors.currentPassword}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                    validatePasswordField('newPassword', e.target.value)
                  }}
                  className={`input-field pr-10 ${formErrors.newPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPasswords((s) => ({ ...s, new: !s.new }))}
                >
                  {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formErrors.newPassword && <p className="mt-1 text-xs text-red-500">{formErrors.newPassword}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    validatePasswordField('confirmPassword', e.target.value)
                  }}
                  className={`input-field pr-10 ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))}
                >
                  {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{formErrors.confirmPassword}</p>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
