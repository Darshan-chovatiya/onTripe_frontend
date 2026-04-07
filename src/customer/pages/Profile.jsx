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
  LogOut
} from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import Loader from '@/shared/components/Loader.jsx'

export default function Profile() {
  const { user, setUser, logout } = useAuth()
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
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in pb-32 pt-10 px-4">
      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl shadow-gray-200/50 dark:shadow-none p-8 md:p-12 border border-gray-100 dark:border-white/5 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-600/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="relative group mb-6">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-[2.5rem] bg-gradient-to-tr from-primary-500 to-indigo-600 p-1 shadow-lg group-hover:scale-105 transition-transform duration-300">
               <div className="w-full h-full rounded-[2.3rem] bg-white dark:bg-gray-800 flex items-center justify-center relative overflow-hidden">
                  <span className="text-5xl font-black text-primary-600 dark:text-primary-400 select-none">
                    {profile?.name?.charAt(0).toUpperCase() || 'C'}
                  </span>
               </div>
            </div>
            <button className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-900 p-2.5 rounded-2xl shadow-md border border-gray-100 dark:border-white/10 text-primary-600 hover:scale-110 transition-transform">
              <Camera size={18} />
            </button>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            {profile?.name || 'Quick Traveler'}
          </h1>
        </div>

        {/* Info Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Account Details</h2>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-black text-xs uppercase tracking-widest transition-all hover:translate-x-1"
              >
                <Edit2 size={16} /> Edit Info
              </button>
            ) : (
              <button 
                onClick={() => { setIsEditing(false); setFormData({ name: profile.name || '', email: profile.email || '' }); }}
                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-500 font-black text-xs uppercase tracking-widest transition-colors"
              >
                <X size={18} /> Cancel
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-6 animate-scale-in">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-5">Public Name</label>
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-600 transition-colors" size={20} />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your Name"
                    required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary-500 rounded-3xl py-5 pl-16 pr-6 transition-all text-gray-900 dark:text-white font-black text-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-5">Email Hub</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-600 transition-colors" size={20} />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary-500 rounded-3xl py-5 pl-16 pr-6 transition-all text-gray-900 dark:text-white font-black text-xl"
                  />
                </div>
              </div>

              <button 
                disabled={isUpdating}
                className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-3xl font-black text-xl shadow-xl shadow-primary-200 active:scale-95 transition-all flex items-center justify-center gap-4 mt-6"
              >
                {isUpdating ? <Loader size="sm" /> : <Save size={24} />}
                Confirm Changes
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-6 p-5 rounded-[2rem] bg-gray-50/50 dark:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/10 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-primary-500 shadow-sm transition-transform group-hover:scale-110">
                  <User size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Name</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{profile?.name || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 p-5 rounded-[2rem] bg-gray-50/50 dark:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/10 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-indigo-500 shadow-sm transition-transform group-hover:scale-110">
                  <Mail size={24} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Email</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white truncate">{profile?.email || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 p-5 rounded-[2rem] bg-gray-50/50 dark:bg-white/5 border border-transparent opacity-90 backdrop-grayscale transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-green-500 shadow-sm transition-transform group-hover:scale-110">
                  <Phone size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Mobile Number</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white font-mono">+91 {profile?.phone}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
