import { useEffect, useState } from 'react'
import { User, Mail, Phone, Edit2, Save, X, MapPin, Briefcase, Building2 } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import { getVendorProfile, updateVendorProfile } from '@/vendor/services/vendorApi.js'
import { getApiErrorMessage } from '@/shared/services/apiHelpers.js'
import Loader from '@/shared/components/Loader.jsx'

const TYPE_LABELS = {
  hotel: 'Hotel',
  transport: 'Transport',
  restaurant: 'Restaurant',
  activity_provider: 'Activity Provider',
  guide: 'Guide',
  cruise: 'Cruise',
  other: 'Other',
}

export default function VendorProfile() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
  })

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await getVendorProfile()
      if (res.data?.success) {
        const v = res.data.data.vendor
        setVendor(v)
        setFormData({
          name: v.name || '',
          contactPerson: v.contactPerson || '',
          email: v.email || '',
          phone: v.phone || '',
          address: v.address || '',
          city: v.city || '',
          state: v.state || '',
          country: v.country || '',
        })
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const res = await updateVendorProfile(formData)
      if (res.data?.success) {
        const v = res.data.data.vendor
        setVendor(v)
        setUser((prev) => ({ ...prev, name: v.name, email: v.email, phone: v.phone }))
        setIsEditing(false)
        toast.success('Profile updated successfully')
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Update failed')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <Loader size="lg" text="Loading profile..." />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-32 pt-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Vendor Profile</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your business details and contact info.</p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-primary-200"
          >
            <Edit2 size={16} /> Edit Profile
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="h-24 bg-linear-to-r from-primary-500 via-indigo-500 to-violet-500" />
        <div className="px-6 pb-6 -mt-12">
          <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-primary-600">
            <Briefcase size={40} />
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-gray-900">{vendor?.name || user?.name || 'Vendor'}</h2>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Building2 size={14} />
              {TYPE_LABELS[vendor?.type] || vendor?.type || 'Vendor'}
            </p>
          </div>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900">Edit details</h3>
            <button type="button" onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X size={18} />
            </button>
          </div>
          {[
            ['name', 'Business name', User],
            ['contactPerson', 'Contact person', User],
            ['email', 'Email', Mail],
            ['phone', 'Phone', Phone],
            ['address', 'Address', MapPin],
            ['city', 'City', MapPin],
            ['state', 'State', MapPin],
            ['country', 'Country', MapPin],
          ].map(([key, label, Icon]) => (
            <div key={key}>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Icon size={14} className="text-primary-500" /> {label}
              </label>
              <input
                type="text"
                className="input-field w-full"
                value={formData[key]}
                onChange={(e) => setFormData((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isUpdating} className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {isUpdating ? 'Saving...' : <><Save size={16} /> Save</>}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['Business name', vendor?.name, User],
            ['Contact person', vendor?.contactPerson, User],
            ['Email', vendor?.email, Mail],
            ['Phone', vendor?.phone, Phone],
            ['Address', vendor?.address, MapPin],
            ['City', vendor?.city, MapPin],
            ['State', vendor?.state, MapPin],
            ['Country', vendor?.country, MapPin],
            ['Service type', TYPE_LABELS[vendor?.type] || vendor?.type, Briefcase],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-xl bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                <Icon size={14} /> {label}
              </div>
              <p className="text-sm font-semibold text-gray-900">{value || '—'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
