import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Phone, Key, Eye, EyeOff, Ticket } from 'lucide-react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/components/ToastContainer.jsx'
import Loader from '@/shared/components/Loader.jsx'

export default function ChildRegister() {
  const navigate = useNavigate()
  const { registerAgent, isLoading } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    parentCode: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await registerAgent(formData)
    if (res.success) {
      toast.success('Your agency is now registered! Redirecting to login...')
      setTimeout(() => navigate('/travelAgency/child/login'), 2000)
    } else {
      toast.error(res.message || 'Registration failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md animate-scale-in rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600 shadow-lg">
            <Ticket className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Child Agent Registration</h1>
          <p className="mt-1 text-sm text-gray-600">Join our growing ecosystem</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4 text-primary-500" /> Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              className="input-field"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Mail className="h-4 w-4 text-primary-500" /> Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              className="input-field"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Phone className="h-4 w-4 text-primary-500" /> Phone number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              className="input-field"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Lock className="h-4 w-4 text-primary-500" /> Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="input-field pr-10"
                value={formData.password}
                onChange={handleChange}
                minLength="8"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Key className="h-4 w-4 text-primary-500" /> Parent Invitation Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="parentCode"
              placeholder="Ex: ONTRIP-XXXXX"
              className="input-field"
              value={formData.parentCode}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn-primary w-full shadow-primary-500/10">
            {isLoading ? <div className="flex items-center justify-center gap-2"><Loader size="sm" color="white" /> Registering...</div> : 'Register Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Already a partner? </span>
          <Link to="/travelAgency/child/login" className="font-semibold text-primary-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
