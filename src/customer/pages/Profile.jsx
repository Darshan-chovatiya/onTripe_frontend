import { useEffect, useState } from 'react'
import {
  User,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  Camera,
  ShieldCheck,
  LogOut,
  Ticket
} from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import Loader from '@/shared/components/Loader.jsx'

export default function Profile() {
  const { setUser } = useAuth()
  const { toast } = useToast()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const { data } = await axiosInstance.get('/customer/profile')
      if (data?.success) {
        setProfile(data.data.customer)
        setFormData({
          name: data.data.customer.name || '',
          email: data.data.customer.email || ''
        })
      }
    } catch (err) {
      toast.error('Failed to load profile')
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
      const { data } = await axiosInstance.put('/customer/profile', formData)
      if (data?.success) {
        setProfile(data.data.customer)
        setUser({ name: data.data.customer.name, email: data.data.customer.email })
        setIsEditing(false)
        toast.success('Your profile has been updated!')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center p-8"><Loader size="lg" text="Syncing profile..." /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-32 pt-6 px-4">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Profile Dashboard</h1>
          <p className="text-gray-500 font-medium font-inter mt-1">Manage your identity and travel preferences.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-primary-200"
          >
            <Edit2 size={16} /> Edit Profile
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Profile Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border-2 border-primary-50 dark:border-white/5 p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
            {/* Gradient Accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-indigo-600" />

            <div className="relative mb-6 mt-4">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-gradient-to-tr from-primary-500 to-indigo-600 p-1 shadow-2xl transition-transform duration-500 group-hover:rotate-3">
                <div className="w-full h-full rounded-[2.3rem] bg-white dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
                  <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-600 to-indigo-700 select-none">
                    {profile?.name?.charAt(0).toUpperCase() || 'C'}
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white dark:border-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg" title="Account Verified">
                <ShieldCheck size={20} className="text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-black text-gray-900 dark:text-white truncate w-full px-2">
              {profile?.name || 'Quick Traveler'}
            </h2>
          </div>
        </div>

        {/* RIGHT COLUMN: Account Details / Forms */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 md:p-10 shadow-sm relative">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-white/5 rounded-2xl text-indigo-600">
                  <User size={24} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Identity Details</h3>
              </div>
              {isEditing && (
                <button
                  onClick={() => { setIsEditing(false); setFormData({ name: profile.name || '', email: profile.email || '' }); }}
                  className="p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-8 animate-scale-in">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Public Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-600 transition-colors" size={20} />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-500 rounded-3xl py-5 pl-16 pr-6 transition-all text-gray-900 dark:text-white font-bold text-lg outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Primary Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-600 transition-colors" size={20} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary-500 rounded-3xl py-5 pl-16 pr-6 transition-all text-gray-900 dark:text-white font-bold text-lg outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 border-t border-gray-100 dark:border-white/5 pt-8">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Discard
                  </button>
                  <button
                    disabled={isUpdating}
                    className="px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-200 active:scale-95 transition-all flex items-center gap-3"
                  >
                    {isUpdating ? <Loader size="xs" /> : <Save size={18} />}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 group">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Display Name</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-primary-500 shadow-sm"><User size={20} /></div>
                    <p className="text-xl font-black text-gray-900 dark:text-white truncate">{profile?.name || 'Not set'}</p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 group">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Email</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-indigo-500 shadow-sm"><Mail size={20} /></div>
                    <p className="text-xl font-black text-gray-900 dark:text-white truncate">{profile?.email || 'Not set'}</p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 group">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Phone</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-green-500 shadow-sm"><Phone size={20} /></div>
                    <p className="text-xl font-black text-gray-900 dark:text-white">+91 {profile?.phone}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
