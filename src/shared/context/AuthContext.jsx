import { createContext, useContext } from 'react'

/**
 * @typedef {Object} AuthUser
 * @property {string|number} id
 * @property {string} [name]
 * @property {string} [email]
 * @property {'admin'|'parentAgency'|'childAgency'|'subChild'|'customer'} role
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {AuthUser | null} user
 * @property {string | null} token
 * @property {boolean} isAuthenticated
 * @property {boolean} isCheckingAuth
 * @property {boolean} isLoading
 * @property {(credentials: object) => Promise<{ success: boolean, message?: string }>} login
 * @property {() => void} logout
 * @property {() => Promise<void>} checkAuth
 * @property {(partial: Partial<AuthUser>) => void} setUser
 * @property {(mobile: string) => Promise<{ success: boolean, message?: string }>} sendCustomerOTP
 * @property {(mobile: string, otp: string, name?: string, email?: string) => Promise<{ success: boolean, message?: string }>} verifyCustomerOTP
 */

/** @type {import('react').Context<AuthContextValue | null>} */
export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
