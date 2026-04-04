import { Link } from 'react-router-dom'

/** Minimal top bar for marketing / auth shells */
export default function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-lg font-bold text-primary-600">
          OnTrip
        </Link>
        <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-primary-600">
          Sign in
        </Link>
      </div>
    </header>
  )
}
