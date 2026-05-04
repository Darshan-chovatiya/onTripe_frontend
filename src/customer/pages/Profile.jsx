import { useEffect, useRef, useState } from 'react'
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
  Ticket,
  ChevronRight,
  Map,
  Users,
  Star,
  MessageSquare
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import Loader from '@/shared/components/Loader.jsx'

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '').replace(/\/$/, '') || 'http://localhost:5001'
const avatarUrl = (path) => path ? (path.startsWith('http') ? path : `${API_BASE}/${String(path).replace(/^\//, '')}`) : null

export default function Profile() {
  const { setUser } = useAuth()
  const { toast } = useToast()
  const imgInputRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [isUpdating, setIsUpdating] = useState(false)
  const [showReviewsPopup, setShowReviewsPopup] = useState(false)
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState(null)

  const [reviews, setReviews] = useState([])

  const fetchProfileAndReviews = async () => {
    setLoading(true)
    try {
      const [profileRes, reviewsRes] = await Promise.all([
        axiosInstance.get('/customer/profile'),
        axiosInstance.get('/customer/reviews').catch(() => ({ data: { data: { reviews: [] } } }))
      ])

      if (profileRes.data?.success) {
        setProfile(profileRes.data.data.customer)
        setFormData({
          name: profileRes.data.data.customer.name || '',
          email: profileRes.data.data.customer.email || ''
        })
      }
      if (reviewsRes.data?.success) {
        setReviews(reviewsRes.data.data.reviews || [])
      }
    } catch (err) {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileAndReviews()
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const fd = new FormData()
      fd.append('name', formData.name)
      fd.append('email', formData.email)
      if (imgFile) fd.append('profileImage', imgFile)

      const { data } = await axiosInstance.put('/customer/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data?.success) {
        setProfile(data.data.customer)
        setUser(prev => ({ ...prev, name: data.data.customer.name, email: data.data.customer.email }))
        setImgFile(null)
        setImgPreview(null)
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

      {/* Top Horizontal Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Link to="/customer/trip-history" className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 hover:text-emerald-700 transition-all shadow-sm group">
          <div className="p-3 bg-emerald-50 dark:bg-white/5 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform"><Map size={20} /></div>
          <div>
            <p className="font-black text-sm">Trip History</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Past Journeys</p>
          </div>
        </Link>
        <Link to="/customer/community" className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-300 hover:text-indigo-700 transition-all shadow-sm group">
          <div className="p-3 bg-indigo-50 dark:bg-white/5 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform"><Users size={20} /></div>
          <div>
            <p className="font-black text-sm">Community Chat</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Connect</p>
          </div>
        </Link>
        <button onClick={() => setShowReviewsPopup(true)} className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-700 dark:text-gray-300 hover:text-amber-700 transition-all shadow-sm group text-left">
          <div className="p-3 bg-amber-50 dark:bg-white/5 rounded-xl text-amber-600 group-hover:scale-110 transition-transform"><Star size={20} /></div>
          <div>
            <p className="font-black text-sm">My Reviews</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{reviews.length} Total Reviews</p>
          </div>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Profile Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm flex flex-col items-center text-center">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white truncate w-full px-2 mb-1">
              {profile?.name || 'Traveler'}
            </h2>
            <p className="text-xs font-black uppercase tracking-widest text-primary-600 mb-8">Verified Explorer</p>

            <div className="relative mb-6">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-600 p-[3px] shadow-2xl transition-transform duration-500 hover:scale-105">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
                  {(imgPreview || avatarUrl(profile?.profileImage))
                    ? <img src={imgPreview || avatarUrl(profile.profileImage)} alt="profile" className="w-full h-full object-cover" />
                    : <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-600 to-indigo-700 select-none">
                        {profile?.name?.charAt(0).toUpperCase() || 'T'}
                      </span>
                  }
                </div>
              </div>
              {/* Camera edit button */}
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                className="absolute bottom-2 right-2 bg-gray-900 hover:bg-gray-700 border-4 border-white dark:border-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition"
                title="Change profile photo"
              >
                <Camera size={18} className="text-white" />
              </button>
              <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setImgFile(file)
                  setImgPreview(URL.createObjectURL(file))
                  setIsEditing(true)
                }}
              />
              <div className="absolute top-2 right-2 bg-emerald-500 border-4 border-white dark:border-gray-800 w-8 h-8 rounded-full flex items-center justify-center shadow-lg" title="Account Verified">
                <ShieldCheck size={16} className="text-white" />
              </div>
            </div>
            {imgFile && (
              <p className="text-xs font-semibold text-amber-600 mb-2">Photo selected — save to apply</p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Account Details / Forms */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 md:p-10 shadow-sm relative">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Identity & other details</h3>
              </div>
              {!isEditing && (
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              )}
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
                <div className="flex flex-col gap-6">
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
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="border-b border-gray-100 dark:border-white/5 pb-5">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">Display Name</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white truncate">{profile?.name || 'Not set'}</p>
                </div>

                <div className="border-b border-gray-100 dark:border-white/5 pb-5">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">Primary Email</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white truncate">{profile?.email || 'Not set'}</p>
                </div>

                <div className="border-b border-gray-100 dark:border-white/5 pb-5">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">Phone Number</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">+91 {profile?.phone || 'Not provided'}</p>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Popup */}
      {showReviewsPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReviewsPopup(false)} />
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="p-2 rounded-xl bg-amber-50"><Star size={24} /></div>
                <h3 className="text-lg font-black uppercase tracking-widest">My Reviews</h3>
              </div>
              <button onClick={() => setShowReviewsPopup(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={20} /></button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
              {reviews.length > 0 ? (
                reviews.map((review, idx) => (
                  <div key={review._id || idx} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{review.package?.title || 'Trip Package'}</h4>
                      <div className="flex shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            className={i < review.overallRating ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-600"} 
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{review.comment}"</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                    <Star size={24} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 font-medium">You haven't left any reviews yet.</p>
                </div>
              )}
            </div>
            <button onClick={() => setShowReviewsPopup(false)} className="mt-8 w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
