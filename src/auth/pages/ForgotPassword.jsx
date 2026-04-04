import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Forgot password</h1>
        <p className="mt-2 text-sm text-gray-600">Connect this screen to your reset-password API when ready.</p>
        <Link to="/login" className="mt-6 inline-block text-sm font-medium text-primary-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
