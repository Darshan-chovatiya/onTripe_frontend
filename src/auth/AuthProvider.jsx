import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AuthContext } from '@/shared/context/AuthContext.jsx'
import axiosInstance from '@/shared/services/axiosInstance.js'
import { ROLES } from '@/shared/utils/constants.js'
import {
  AUTH_SCOPES,
  clearStoredSession,
  getScopeFromPathname,
  loadStoredSession,
  persistStoredSession,
} from '@/shared/utils/authStorage.js'

/**
 * @param {Record<string, unknown>} raw
 * @param {string} [loginRoleHint]
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
    sub_child: ROLES.CHILD_AGENCY,
    sub_child_agent: ROLES.CHILD_AGENCY,
    subchild: ROLES.CHILD_AGENCY,
    vendor: ROLES.VENDOR,
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

/** @typedef {{ user: object, token: string } | null} Session */

const EMPTY_SESSIONS = {
  [AUTH_SCOPES.CUSTOMER]: null,
  [AUTH_SCOPES.VENDOR]: null,
  [AUTH_SCOPES.APP]: null,
}

export function AuthProvider({ children }) {
  const location = useLocation()
  const [sessions, setSessions] = useState(EMPTY_SESSIONS)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const activeScope = getScopeFromPathname(location.pathname)
  const activeSession = sessions[activeScope]
  const user = activeSession?.user ?? null
  const token = activeSession?.token ?? null

  const customerSession = sessions[AUTH_SCOPES.CUSTOMER]
  const vendorSession = sessions[AUTH_SCOPES.VENDOR]

  const applySessionForScope = useCallback((scope, nextUser, nextToken) => {
    const u = normalizeUser(nextUser)
    if (!u) return
    const session = { user: u, token: nextToken }
    persistStoredSession(scope, nextToken, u)
    setSessions((prev) => ({ ...prev, [scope]: session }))
  }, [])

  const clearSessionForScope = useCallback((scope) => {
    clearStoredSession(scope)
    setSessions((prev) => ({ ...prev, [scope]: null }))
  }, [])

  const logout = useCallback(
    (scope) => {
      const target = scope || getScopeFromPathname(location.pathname)
      clearSessionForScope(target)
    },
    [location.pathname, clearSessionForScope]
  )

  const setUser = useCallback(
    (partial) => {
      const scope = getScopeFromPathname(location.pathname)
      setSessions((prev) => {
        const current = prev[scope]
        if (!current) return prev
        const nextUser = { ...current.user, ...partial }
        persistStoredSession(scope, current.token, nextUser)
        return { ...prev, [scope]: { ...current, user: nextUser } }
      })
    },
    [location.pathname]
  )

  const validateScope = useCallback(async (scope) => {
    const stored = loadStoredSession(scope)
    if (!stored?.token) return null

    try {
      const { data } = await axiosInstance.get('/auth/me', {
        headers: { Authorization: `Bearer ${stored.token}` },
        authScope: scope,
      })
      if (data?.success && data?.data?.user) {
        const u = normalizeUser(data.data.user, stored.user?.role)
        if (!u) {
          clearStoredSession(scope)
          return null
        }
        persistStoredSession(scope, stored.token, u)
        return { token: stored.token, user: u }
      }
      clearStoredSession(scope)
      return null
    } catch {
      clearStoredSession(scope)
      return null
    }
  }, [])

  const checkAuth = useCallback(async () => {
    setIsCheckingAuth(true)
    try {
      const [customer, vendor, app] = await Promise.all([
        validateScope(AUTH_SCOPES.CUSTOMER),
        validateScope(AUTH_SCOPES.VENDOR),
        validateScope(AUTH_SCOPES.APP),
      ])
      setSessions({
        [AUTH_SCOPES.CUSTOMER]: customer,
        [AUTH_SCOPES.VENDOR]: vendor,
        [AUTH_SCOPES.APP]: app,
      })
    } finally {
      setIsCheckingAuth(false)
    }
  }, [validateScope])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

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
          applySessionForScope(AUTH_SCOPES.APP, u, data.data.token)
          return { success: true, role: u.role, user: u, message: data.message }
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
    [applySessionForScope]
  )

  const registerAgent = useCallback(async (agentData) => {
    setIsLoading(true)
    try {
      const { data } = await axiosInstance.post('/auth/register/agent', agentData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data?.success) return { success: true, message: data.message }
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
  }, [])

  const registerParent = useCallback(async (formData) => {
    setIsLoading(true)
    try {
      const { data } = await axiosInstance.post('/auth/register/parent', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data?.success) return { success: true, message: data.message }
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
  }, [])

  const requestCustomerOtp = useCallback(async (phone) => {
    setIsLoading(true)
    try {
      const { data } = await axiosInstance.post('/auth/otp/customer', { phone })
      return { success: data?.success, message: data?.message }
    } catch (e) {
      return { success: false, message: e?.response?.data?.message || 'Failed to send OTP' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginCustomer = useCallback(
    async (phone, otp) => {
      setIsLoading(true)
      try {
        const { data } = await axiosInstance.post('/auth/login/customer', { phone, otp })
        if (data?.success && data?.data?.token) {
          const u = normalizeUser({ role: 'customer', phone, id: data.data.customerId })
          applySessionForScope(AUTH_SCOPES.CUSTOMER, u, data.data.token)
          return { success: true, role: u.role, message: data.message }
        }
        return { success: false, message: data?.message || 'Login failed' }
      } catch (e) {
        return { success: false, message: e?.response?.data?.message || 'Login failed' }
      } finally {
        setIsLoading(false)
      }
    },
    [applySessionForScope]
  )

  const requestVendorOtp = useCallback(async (phone) => {
    setIsLoading(true)
    try {
      const { data } = await axiosInstance.post('/auth/otp/vendor', { phone })
      return { success: data?.success, message: data?.message }
    } catch (e) {
      return { success: false, message: e?.response?.data?.message || 'Failed to send OTP' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginVendor = useCallback(
    async (phone, otp) => {
      setIsLoading(true)
      try {
        const { data } = await axiosInstance.post('/auth/login/vendor', { phone, otp })
        if (data?.success && data?.data?.token && data?.data?.user) {
          const u = normalizeUser(data.data.user)
          applySessionForScope(AUTH_SCOPES.VENDOR, u, data.data.token)
          return { success: true, role: u.role, message: data.message }
        }
        return { success: false, message: data?.message || 'Login failed' }
      } catch (e) {
        return { success: false, message: e?.response?.data?.message || 'Login failed' }
      } finally {
        setIsLoading(false)
      }
    },
    [applySessionForScope]
  )

  const requestPasswordReset = useCallback(async (email) => {
    setIsLoading(true)
    try {
      const { data } = await axiosInstance.post('/auth/forgot-password/request', { email })
      return { success: data?.success, message: data?.message }
    } catch (e) {
      return { success: false, message: e?.response?.data?.message || 'Failed to send OTP' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyResetOtp = useCallback(async (email, otp) => {
    setIsLoading(true)
    try {
      const { data } = await axiosInstance.post('/auth/forgot-password/verify', { email, otp })
      return { success: data?.success, message: data?.message }
    } catch (e) {
      return { success: false, message: e?.response?.data?.message || 'Invalid OTP' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email, otp, newPassword) => {
    setIsLoading(true)
    try {
      const { data } = await axiosInstance.post('/auth/forgot-password/reset', { email, otp, newPassword })
      return { success: data?.success, message: data?.message }
    } catch (e) {
      return { success: false, message: e?.response?.data?.message || 'Failed to reset password' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isCustomerAuthenticated: Boolean(customerSession?.user && customerSession?.token),
      isVendorAuthenticated: Boolean(vendorSession?.user && vendorSession?.token),
      customerUser: customerSession?.user ?? null,
      vendorUser: vendorSession?.user ?? null,
      activeScope,
      isCheckingAuth,
      isLoading,
      login,
      logout,
      checkAuth,
      setUser,
      registerAgent,
      registerParent,
      loginCustomer,
      requestCustomerOtp,
      loginVendor,
      requestVendorOtp,
      requestPasswordReset,
      verifyResetOtp,
      resetPassword,
    }),
    [
      user,
      token,
      customerSession,
      vendorSession,
      activeScope,
      isCheckingAuth,
      isLoading,
      login,
      logout,
      checkAuth,
      setUser,
      registerAgent,
      registerParent,
      loginCustomer,
      requestCustomerOtp,
      loginVendor,
      requestVendorOtp,
      requestPasswordReset,
      verifyResetOtp,
      resetPassword,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
