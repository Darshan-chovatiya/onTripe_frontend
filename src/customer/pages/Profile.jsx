import { useEffect, useState } from 'react'
import { User, Mail, Phone, Edit2, Save, X, ShieldCheck, Sparkles } from 'lucide-react'
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
          email: data.data.customer.email || '',
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

  const cancelEdit = () => {
    setIsEditing(false)
    setFormData({ name: profile?.name || '', email: profile?.email || '' })
  }

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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader size="lg" text="Loading profile…" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl pb-24 sm:pb-28">
      {/* Page title */}
      <header className="mb-8 sm:mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-primary-600/90 dark:text-primary-400/90">
          Account
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Profile dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Keep your name and email current so confirmations and trip updates reach you. Phone is shown for your
          reference.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Main panel */}
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-white/10 dark:bg-gray-950">
            {/* Hero strip */}
            <div className="border-b border-gray-100 bg-gradient-to-br from-gray-50/90 via-white to-primary-50/30 px-5 py-6 dark:border-white/10 dark:from-white/[0.04] dark:via-gray-950 dark:to-primary-950/20 sm:px-8 sm:py-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
                <div className="relative shrink-0">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-3xl font-semibold text-primary-700 shadow-md ring-1 ring-gray-200/80 dark:bg-gray-900 dark:text-primary-300 dark:ring-white/10 sm:h-28 sm:w-28 sm:text-4xl">
                    {profile?.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500 text-white shadow-sm dark:border-gray-950"
                    title="Verified account"
                  >
                    <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <>
                      <p className="text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
                        Editing profile
                      </p>
                      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">Update your details</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Changes apply to new bookings and emails.</p>
                    </>
                  ) : (
                    <>
                      <p className="truncate text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                        {profile?.name || 'Traveler'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        {profile?.email ? (
                          <span className="inline-flex items-center gap-1.5 truncate">
                            <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" />
                            {profile.email}
                          </span>
                        ) : null}
                        {profile?.phone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" />
                            {profile.phone}
                          </span>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 sm:w-auto dark:border-white/10 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      <X className="h-4 w-4" strokeWidth={2} />
                      Close
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 sm:w-auto"
                    >
                      <Edit2 className="h-4 w-4" strokeWidth={2} />
                      Edit profile
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <div className="mb-6 flex items-end justify-between gap-4 border-b border-gray-100 pb-4 dark:border-white/10">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Contact information</h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {isEditing ? 'Edit the fields below, then save.' : 'How we identify you on trips and receipts.'}
                  </p>
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="animate-scale-in space-y-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="profile-name" className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        Full name
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          id="profile-name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          autoComplete="name"
                          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 dark:border-white/10 dark:bg-gray-900 dark:text-white dark:focus:border-primary-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="profile-email" className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          id="profile-email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          autoComplete="email"
                          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 dark:border-white/10 dark:bg-gray-900 dark:text-white dark:focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 dark:border-white/10 sm:flex-row sm:justify-end sm:gap-3">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-60"
                    >
                      {isUpdating ? (
                        <span
                          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                          aria-hidden
                        />
                      ) : (
                        <Save className="h-4 w-4" strokeWidth={2} />
                      )}
                      Save changes
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="divide-y divide-gray-100 dark:divide-white/10">
                  <div className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[minmax(0,140px)_1fr] sm:items-center sm:gap-6">
                    <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      <User className="h-3.5 w-3.5 text-primary-500" strokeWidth={2} />
                      Name
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">{profile?.name || '—'}</dd>
                  </div>
                  <div className="grid gap-1 py-4 sm:grid-cols-[minmax(0,140px)_1fr] sm:items-center sm:gap-6">
                    <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      <Mail className="h-3.5 w-3.5 text-sky-500" strokeWidth={2} />
                      Email
                    </dt>
                    <dd className="break-all text-sm font-medium text-gray-900 dark:text-white sm:text-base">
                      {profile?.email ? (
                        <a href={`mailto:${profile.email}`} className="text-primary-600 hover:underline dark:text-primary-400">
                          {profile.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-4 sm:grid-cols-[minmax(0,140px)_1fr] sm:items-center sm:gap-6">
                    <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                      Phone
                    </dt>
                    <dd className="text-sm font-medium text-gray-900 dark:text-white sm:text-base">
                      {profile?.phone ? (
                        <a href={`tel:${profile.phone}`} className="text-primary-600 hover:underline dark:text-primary-400">
                          {profile.phone}
                        </a>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-950 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Account status</h3>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-emerald-50/80 p-4 dark:bg-emerald-950/25">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <ShieldCheck className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Verified traveler</p>
                <p className="mt-1 text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-200/80">
                  Your account is active. Booking confirmations use the email on file.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200/90 bg-gray-50/60 p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-primary-500 dark:text-primary-400" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Tip</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                  Name and email can be updated here anytime. To change your phone number, contact your travel agency or
                  support—they’ll update it on your booking profile.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
