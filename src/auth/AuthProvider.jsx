import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '@/shared/context/AuthContext.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { AUTH_STORAGE_KEY, ROLES } from '@/shared/utils/constants.js'

/**
 * @param {Record<string, unknown>} raw
 * @param {string} [loginRoleHint] — used when API returns generic "organizer"
 */
function normalizeUser(raw, loginRoleHint) {
  if (!raw || typeof raw !== 'object') return null
  const o = /** @type {Record<string, unknown>} */ (raw)
  const id = o.id ?? o._id
  const rawRole = String(o.role || '')
    .toLowerCase()
    .replace(/\s+/g, '')

  const map = {
    admin: ROLES.ADMIN,
    customer: ROLES.CUSTOMER,
    parent_agency: ROLES.PARENT_AGENCY,
    parentagency: ROLES.PARENT_AGENCY,
    parent: ROLES.PARENT_AGENCY,
    child_agency: ROLES.CHILD_AGENCY,
    childagency: ROLES.CHILD_AGENCY,
    sub_child: ROLES.SUB_CHILD,
    subchild: ROLES.SUB_CHILD,
    organizer: loginRoleHint || ROLES.PARENT_AGENCY,
  }

  let role = map[rawRole]
  if (!role && loginRoleHint) role = loginRoleHint
  if (!role) role = ROLES.CUSTOMER

  return {
    ...o,
    id,
    name: o.name != null ? String(o.name) : '',
    email: o.email != null ? String(o.email) : '',
    role,
  }
}

function loadStored() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.token && parsed?.user) {
      return { token: parsed.token, user: normalizeUser(parsed.user) }
    }
  } catch {
    /* ignore */
  }
  return null
}

function persist(token, user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }))
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null)
  const [token, setToken] = useState(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const logout = useCallback(() => {
    setUserState(null)
    setToken(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
    delete axiosInstance.defaults.headers.common.Authorization
  }, [])

  const setUser = useCallback((partial) => {
    setUserState((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...partial }
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY)
        const parsed = raw ? JSON.parse(raw) : null
        if (parsed?.token) persist(parsed.token, next)
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const applySession = useCallback((nextUser, nextToken) => {
    const u = normalizeUser(nextUser)
    if (!u) return
    setUserState(u)
    setToken(nextToken)
    persist(nextToken, u)
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${nextToken}`
  }, [])

  const checkAuth = useCallback(async () => {
    setIsCheckingAuth(true)
    const stored = loadStored()
    if (!stored?.token) {
      logout()
      setIsCheckingAuth(false)
      return
    }
    setToken(stored.token)
    setUserState(stored.user)
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${stored.token}`

    try {
      const { data } = await axiosInstance.get('/auth/me')
      if (data?.status === 200 && data?.result?.user) {
        const u = normalizeUser(data.result.user, stored.user?.role)
        if (!u) {
          logout()
          return
        }
        setUserState(u)
        persist(stored.token, u)
      } else {
        logout()
      }
    } catch {
      logout()
    } finally {
      setIsCheckingAuth(false)
    }
  }, [logout])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  /**
   * @param {object} credentials
   * @param {'password'|'customerOtp'} credentials.type
   */
  const login = useCallback(
    async (credentials) => {
      const { type } = credentials
      if (type === 'password') {
        const { email, password, role } = credentials
        if (!email || !password || !role) {
          return { success: false, message: 'Missing login fields' }
        }
        setIsLoading(true)
        try {
          let path = '/auth/organizer/login'
          if (role === ROLES.ADMIN) path = '/auth/admin/login'
          const { data } = await axiosInstance.post(path, { email, password })
          if (data?.status === 200 && data?.result?.user && data?.result?.token) {
            const u = normalizeUser(data.result.user, role)
            applySession(u, data.result.token)
            return { success: true, role: u.role }
          }
          return { success: false, message: data?.message || 'Login failed' }
        } catch (e) {
          const msg = e?.response?.data?.message || 'Login failed'
          return { success: false, message: msg }
        } finally {
          setIsLoading(false)
        }
      }

      if (type === 'customerOtp') {
        const { mobile, otp } = credentials
        if (!mobile || !otp) return { success: false, message: 'Mobile and OTP required' }
        setIsLoading(true)
        try {
          const { data } = await axiosInstance.post('/auth/login', { mobile, otp })
          if (data?.status === 200 && data?.result?.user && data?.result?.token) {
            const u = normalizeUser(data.result.user, ROLES.CUSTOMER)
            applySession(u, data.result.token)
            return { success: true, role: u.role }
          }
          return { success: false, message: data?.message || 'Login failed' }
        } catch (e) {
          return { success: false, message: e?.response?.data?.message || 'Login failed' }
        } finally {
          setIsLoading(false)
        }
      }

      return { success: false, message: 'Unsupported login type' }
    },
    [applySession]
  )

  const sendCustomerOTP = useCallback(async (mobile) => {
    setIsLoading(true)
    try {
      const { data } = await axiosInstance.post('/auth/send-otp', { mobile })
      setIsLoading(false)
      if (data?.status === 200) return { success: true, message: data.message }
      return { success: false, message: data?.message || 'Failed to send OTP' }
    } catch (e) {
      setIsLoading(false)
      return { success: false, message: e?.response?.data?.message || 'Failed to send OTP' }
    }
  }, [])

  const verifyCustomerOTP = useCallback(
    async (mobile, otp, name, email) => {
      setIsLoading(true)
      try {
        const { data } = await axiosInstance.post('/auth/verify-otp', { mobile, otp, name, email })
        setIsLoading(false)
        if (data?.status === 200 && data?.result?.user && data?.result?.token) {
          const u = normalizeUser(data.result.user, ROLES.CUSTOMER)
          applySession(u, data.result.token)
          return { success: true, message: data.message }
        }
        return { success: false, message: data?.message || 'Verification failed' }
      } catch (e) {
        setIsLoading(false)
        return { success: false, message: e?.response?.data?.message || 'Verification failed' }
      }
    },
    [applySession]
  )

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isCheckingAuth,
      isLoading,
      login,
      logout,
      checkAuth,
      setUser,
      sendCustomerOTP,
      verifyCustomerOTP,
    }),
    [user, token, isCheckingAuth, isLoading, login, logout, checkAuth, setUser, sendCustomerOTP, verifyCustomerOTP]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
