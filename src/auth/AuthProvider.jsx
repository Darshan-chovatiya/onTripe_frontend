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
    parent_agent: ROLES.PARENT_AGENCY,
    parentagency: ROLES.PARENT_AGENCY,
    parent: ROLES.PARENT_AGENCY,
    child_agency: ROLES.CHILD_AGENCY,
    child_agent: ROLES.CHILD_AGENCY,
    childagency: ROLES.CHILD_AGENCY,
    sub_child: ROLES.SUB_CHILD,
    sub_child_agent: ROLES.SUB_CHILD,
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
      const { email, password } = credentials
      if (!email || !password) {
        return { success: false, message: 'Email and password required' }
      }
      setIsLoading(true)
      try {
        const { data } = await axiosInstance.post('/auth/login', { email, password })
        if (data?.success && data?.data?.user && data?.data?.token) {
          const u = normalizeUser(data.data.user)
          applySession(u, data.data.token)
          return { success: true, role: u.role, message: data.message }
        }
        return { success: false, message: data?.message || 'Login failed' }
      } catch (e) {
        const responseData = e?.response?.data
        let msg = responseData?.message || 'Login failed'
        if (responseData?.errors && Array.isArray(responseData.errors)) {
          msg = responseData.errors.join(', ')
        }
        return { success: false, message: msg }
      } finally {
        setIsLoading(false)
      }
    },
    [applySession]
  )

  const registerAgent = useCallback(
    async (agentData) => {
      setIsLoading(true)
      try {
        const { data } = await axiosInstance.post('/auth/register/agent', agentData)
        if (data?.success) {
          return { success: true, message: data.message }
        }
        return { success: false, message: data?.message || 'Registration failed' }
      } catch (e) {
        const responseData = e?.response?.data
        let msg = responseData?.message || 'Registration failed'
        if (responseData?.errors && Array.isArray(responseData.errors)) {
          msg = responseData.errors.join(', ')
        }
        return { success: false, message: msg }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const registerParent = useCallback(
    async (formData) => {
      setIsLoading(true);
      try {
        const { data } = await axiosInstance.post('/auth/register/parent', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (data?.success) {
          return { success: true, message: data.message };
        }
        return { success: false, message: data?.message || 'Registration failed' };
      } catch (e) {
        const responseData = e?.response?.data
        let msg = responseData?.message || 'Registration failed'
        if (responseData?.errors && Array.isArray(responseData.errors)) {
          msg = responseData.errors.join(', ')
        }
        return { success: false, message: msg }
      } finally {
        setIsLoading(false)
      }
    },
    []
  );

  const loginCustomer = useCallback(
    async (phone, bookingId) => {
      setIsLoading(true)
      try {
        const { data } = await axiosInstance.post('/auth/login/customer', { phone, bookingId })
        if (data?.success && data?.data?.token) {
          const u = normalizeUser({ role: 'customer', phone, bookingId })
          applySession(u, data.data.token)
          return { success: true, role: u.role, message: data.message }
        }
        return { success: false, message: data?.message || 'Login failed' }
      } catch (e) {
        return { success: false, message: e?.response?.data?.message || 'Login failed' }
      } finally {
        setIsLoading(false)
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
      registerAgent,
      registerParent,
      loginCustomer,
    }),
    [user, token, isCheckingAuth, isLoading, login, logout, checkAuth, setUser, registerAgent, registerParent, loginCustomer]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
