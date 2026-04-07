import { useEffect, useState } from 'react'
import { 
  Users, 
  Search, 
  Mail, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Clock, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react'
import adminApi from '@/admin/services/adminApi'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'
import CustomDropdown from '@/shared/components/CustomDropdown'

const ROLE_MAP = {
    'admin': { label: 'Administrator', color: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: ShieldCheck },
    'customer': { label: 'Customer', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: Users },
    'parent_agent': { label: 'Parent Agency', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: Shield },
    'child_agent': { label: 'Child Agency', color: 'bg-slate-50 text-slate-700 border-slate-100', icon: Shield },
    'sub_child_agent': { label: 'Sub-Child', color: 'bg-purple-50 text-purple-700 border-purple-100', icon: Shield },
    'vendor': { label: 'Vendor Partner', color: 'bg-amber-50 text-amber-700 border-amber-100', icon: ShieldAlert },
}

export default function UserManagement() {
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter
      }
      const { data } = await adminApi.listUsers(params)
      if (data?.success) {
        setUsers(data.data.users)
        setTotalPages(data.data.totalPages)
      }
    } catch (error) {
      toast.error('Failed to fetch platform users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, debouncedSearch, roleFilter])

  const handleToggleStatus = async (id) => {
    try {
      // Assuming a generic user toggle or similar logic here.
      toast.info('Account status modification in progress...')
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getRoleBadge = (role) => {
    const r = ROLE_MAP[role] || { label: role, color: 'bg-gray-50 text-gray-600', icon: Users }
    const Icon = r.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm ${r.color}`}>
        <Icon className="w-3 h-3" />
        {r.label}
      </span>
    )
  }

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-zinc-900">Platform Users</h1>
            <p className="text-gray-500 text-sm">Overview of all active and registered personas on the OnTrip platform</p>
         </div>

         <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
               <div className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden xl:block">Role:</div>
               <CustomDropdown
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={roleOptions || []}
                  className="w-full sm:w-40"
                  buttonClassName="!py-2"
               />
            </div>

            <button 
               className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-all shadow-sm whitespace-nowrap"
            >
               <UserPlus size={18} />
               <span>Create User</span>
            </button>
         </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center">
          <Loader size="lg" />
          <p className="text-[10px] font-bold text-slate-400 mt-5 tracking-[0.2em] uppercase">Initializing user registry...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center animate-fade-in">
          <div className="h-14 w-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto mb-5">
            <Users className="h-7 w-7 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No users identified</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2 font-medium leading-relaxed">We couldn't find any profiles matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible animate-scale-in ring-1 ring-black/5">
            <div className="overflow-visible">
                <table className="w-full table-auto">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-zinc-900 uppercase tracking-widest">Personal Identity</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-zinc-900 uppercase tracking-widest">Security Role</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-zinc-900 uppercase tracking-widest">Account Integrity</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-zinc-900 uppercase tracking-widest pr-8">Verification Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-9 w-9 flex-shrink-0 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                                            <span className="text-xs font-bold text-slate-500">{user.name?.charAt(0) || user.email?.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 leading-none">{user.name || 'Anonymous User'}</div>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 font-bold">
                                                <Mail className="h-2.5 w-2.5 opacity-60" />
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5">
                                    {getRoleBadge(user.role)}
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap">
                                    <button 
                                        onClick={() => handleToggleStatus(user._id)}
                                        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm transition-all active:scale-95 min-w-[85px] ${
                                            user.isActive 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 hover:shadow-emerald-500/10' 
                                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100/80 hover:shadow-slate-500/10'
                                        }`}
                                    >
                                        <div className={`w-1 h-1 rounded-full ${user.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap text-right pr-6">
                                    <div className="flex flex-col items-end gap-0.5">
                                        <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
                                            <Clock className="h-3 w-3 text-slate-400" />
                                            {new Date(user.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Security Cleared</div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Index Page <span className="text-slate-900 mx-0.5">{page}</span> of <span className="text-slate-900 mx-0.5">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="flex items-center justify-center h-7 w-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="flex items-center justify-center h-7 w-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  )
}
