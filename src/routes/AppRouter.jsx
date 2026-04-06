import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/routes/ProtectedRoute.jsx'

import Login from '@/auth/pages/Login.jsx'
import ForgotPassword from '@/auth/pages/ForgotPassword.jsx'
import Unauthorized from '@/pages/Unauthorized.jsx'
import Landing from '@/pages/Landing.jsx'

import ChildAgentLogin from '@/travelAgency/childAgency/auth/Login.jsx'
import ChildAgentRegister from '@/travelAgency/childAgency/auth/Register.jsx'
import SubChildLogin from '@/travelAgency/subChild/auth/Login.jsx'
import SubChildRegister from '@/travelAgency/subChild/auth/Register.jsx'

import ParentAgentLogin from '@/travelAgency/parentAgency/auth/Login.jsx'
import ParentAgentRegister from '@/travelAgency/parentAgency/auth/Register.jsx'

import AdminLogin from '@/admin/auth/Login.jsx'

import AdminLayout from '@/admin/components/AdminLayout.jsx'
import AdminDashboard from '@/admin/pages/Dashboard.jsx'
import AdminUsers from '@/admin/pages/Users.jsx'
import AdminAgencies from '@/admin/pages/Agencies.jsx'
import AdminReports from '@/admin/pages/Reports.jsx'
import AdminSettings from '@/admin/pages/Settings.jsx'

import AgencyLayout from '@/travelAgency/shared/components/AgencyLayout.jsx'
import ParentAgencySidebar from '@/travelAgency/parentAgency/components/AgencySidebar.jsx'
import ParentDashboard from '@/travelAgency/parentAgency/pages/Dashboard.jsx'
import ParentPackages from '@/travelAgency/parentAgency/pages/Packages.jsx'
import ParentManageChildren from '@/travelAgency/parentAgency/pages/ManageChildren.jsx'
import ParentSettings from '@/travelAgency/parentAgency/pages/Settings.jsx'

import ChildAgencySidebar from '@/travelAgency/childAgency/components/AgencySidebar.jsx'
import ChildDashboard from '@/travelAgency/childAgency/pages/Dashboard.jsx'
import ChildBookings from '@/travelAgency/childAgency/pages/Bookings.jsx'
import ChildManageSubChildren from '@/travelAgency/childAgency/pages/ManageSubChildren.jsx'
import ChildSettings from '@/travelAgency/childAgency/pages/Settings.jsx'

import SubAgencySidebar from '@/travelAgency/subChild/components/AgencySidebar.jsx'
import SubDashboard from '@/travelAgency/subChild/pages/Dashboard.jsx'
import SubMyBookings from '@/travelAgency/subChild/pages/MyBookings.jsx'
import SubProfile from '@/travelAgency/subChild/pages/Profile.jsx'
import SubSettings from '@/travelAgency/subChild/pages/Settings.jsx'

import CustomerLayout from '@/customer/components/CustomerLayout.jsx'
import CustomerHome from '@/customer/pages/Home.jsx'
import CustomerSearch from '@/customer/pages/Search.jsx'
import CustomerBooking from '@/customer/pages/Booking.jsx'
import CustomerTripHistory from '@/customer/pages/TripHistory.jsx'
import CustomerProfile from '@/customer/pages/Profile.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Child and Sub-child Auth Routes */}
      <Route path="/travelAgency/child/login" element={<ChildAgentLogin />} />
      <Route path="/travelAgency/child/register" element={<ChildAgentRegister />} />
      <Route path="/travelAgency/subchild/login" element={<SubChildLogin />} />
      <Route path="/travelAgency/subchild/register" element={<SubChildRegister />} />

      {/* Parent Auth Routes */}
      <Route path="/travelAgency/parent/login" element={<ParentAgentLogin />} />
      <Route path="/travelAgency/parent/register" element={<ParentAgentRegister />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="agencies" element={<AdminAgencies />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route
        path="/agency/parent"
        element={
          <ProtectedRoute>
            <AgencyLayout sidebar={ParentAgencySidebar} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ParentDashboard />} />
        <Route path="packages" element={<ParentPackages />} />
        <Route path="manage-children" element={<ParentManageChildren />} />
        <Route path="settings" element={<ParentSettings />} />
      </Route>

      <Route
        path="/agency/child"
        element={
          <ProtectedRoute>
            <AgencyLayout sidebar={ChildAgencySidebar} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ChildDashboard />} />
        <Route path="bookings" element={<ChildBookings />} />
        <Route path="manage-sub-children" element={<ChildManageSubChildren />} />
        <Route path="settings" element={<ChildSettings />} />
      </Route>

      <Route
        path="/agency/sub"
        element={
          <ProtectedRoute>
            <AgencyLayout sidebar={SubAgencySidebar} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SubDashboard />} />
        <Route path="my-bookings" element={<SubMyBookings />} />
        <Route path="profile" element={<SubProfile />} />
        <Route path="settings" element={<SubSettings />} />
      </Route>

      <Route
        path="/customer"
        element={
          <ProtectedRoute>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<CustomerHome />} />
        <Route path="search" element={<CustomerSearch />} />
        <Route path="booking" element={<CustomerBooking />} />
        <Route path="trip-history" element={<CustomerTripHistory />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
