import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/routes/ProtectedRoute.jsx'
import AgencyPermissionRoute from '@/routes/AgencyPermissionRoute.jsx'
import AgencyLegacyRedirect from '@/routes/AgencyLegacyRedirect.jsx'

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
import AdminSettings from '@/admin/pages/Settings.jsx'
import AdminCustomers from '@/admin/pages/Customers.jsx'
import AdminCustomerDetail from '@/admin/pages/CustomerDetail.jsx'
import AdminPackages from '@/admin/pages/Packages.jsx'
import AdminPackageWhitelabels from '@/admin/pages/PackageWhitelabels.jsx'
import AdminPackageBookings from '@/admin/pages/PackageBookings.jsx'
import AdminAgencyNetwork from '@/admin/pages/AgencyNetwork.jsx'
import AdminChildAgencies from '@/admin/pages/ChildAgencies.jsx'
import AdminAgentWhitelabels from '@/admin/pages/AgentWhitelabels.jsx'
import AdminNotifications from '@/admin/pages/Notifications.jsx'

import AgencyLayout from '@/travelAgency/shared/components/AgencyLayout.jsx'
import AgencyPanelSidebar from '@/travelAgency/agency/components/AgencyPanelSidebar.jsx'
import AgencyDashboard from '@/travelAgency/agency/pages/AgencyDashboard.jsx'
import AgencyPackages from '@/travelAgency/agency/pages/AgencyPackages.jsx'
import AgencyPackageDetail from '@/travelAgency/agency/pages/AgencyPackageDetail.jsx'
import AgencyVendors from '@/travelAgency/agency/pages/AgencyVendors.jsx'
import AgencyBookings from '@/travelAgency/agency/pages/AgencyBookings.jsx'
import AgencyMyBookings from '@/travelAgency/agency/pages/AgencyMyBookings.jsx'
import AgencyManageDownstream from '@/travelAgency/agency/pages/AgencyManageDownstream.jsx'
import AgencyCustomers from '@/travelAgency/agency/pages/AgencyCustomers.jsx'
import AgencyCustomerTrips from '@/travelAgency/agency/pages/AgencyCustomerTrips.jsx'
import AgencySettings from '@/travelAgency/agency/pages/AgencySettings.jsx'
import { P } from '@/travelAgency/agency/rbac/agencyPermissions.js'

import CustomerLayout from '@/customer/components/CustomerLayout.jsx'
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
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="customers/:customerId" element={<AdminCustomerDetail />} />
        <Route path="packages/:packageId/whitelabels" element={<AdminPackageWhitelabels />} />
        <Route path="packages/:packageId/bookings" element={<AdminPackageBookings />} />
        <Route path="packages" element={<AdminPackages />} />
        <Route path="agencies" element={<AdminAgencies />} />
        <Route path="agencies/network/:parentId" element={<AdminAgencyNetwork />} />
        <Route path="child-agencies/:agentId/whitelabels" element={<AdminAgentWhitelabels />} />
        <Route path="sub-child-agencies/:agentId/whitelabels" element={<AdminAgentWhitelabels />} />
        <Route path="child-agencies" element={<AdminChildAgencies key="admin-child-agencies" />} />
        <Route
          path="sub-child-agencies"
          element={
            <AdminChildAgencies
              key="admin-sub-child-agencies"
              agentRole="sub_child_agent"
              pageTitle="Sub-child Agencies"
            />
          }
        />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Legacy agency URLs → unified panel */}
      <Route
        path="/agency/parent/*"
        element={
          <ProtectedRoute>
            <AgencyLegacyRedirect mode="parent" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agency/child/*"
        element={
          <ProtectedRoute>
            <AgencyLegacyRedirect mode="child" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agency/sub/*"
        element={
          <ProtectedRoute>
            <AgencyLegacyRedirect mode="sub" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/agency"
        element={
          <ProtectedRoute>
            <AgencyLayout sidebar={AgencyPanelSidebar} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AgencyDashboard />} />
        <Route
          path="packages"
          element={
            <AgencyPermissionRoute anyOf={[P.PACKAGES_FULL, P.PACKAGES_CLONE]}>
              <AgencyPackages />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="packages/:id"
          element={
            <AgencyPermissionRoute permission={P.PACKAGES_FULL}>
              <AgencyPackageDetail />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="vendors"
          element={
            <AgencyPermissionRoute permission={P.VENDORS}>
              <AgencyVendors />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="bookings"
          element={
            <AgencyPermissionRoute anyOf={[P.BOOKINGS_NETWORK, P.BOOKINGS_SALES]}>
              <AgencyBookings />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="my-bookings"
          element={
            <AgencyPermissionRoute permission={P.BOOKINGS_OWN}>
              <AgencyMyBookings />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="manage-downstream"
          element={
            <AgencyPermissionRoute anyOf={[P.NETWORK_CHILDREN, P.NETWORK_SUBCHILDREN]}>
              <AgencyManageDownstream />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="customers"
          element={
            <AgencyPermissionRoute permission={P.CUSTOMERS}>
              <AgencyCustomers />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="customers/:agencyCustomerId/trips"
          element={
            <AgencyPermissionRoute permission={P.CUSTOMERS}>
              <AgencyCustomerTrips />
            </AgencyPermissionRoute>
          }
        />
        <Route path="profile" element={<Navigate to="/agency/customers" replace />} />
        <Route path="settings" element={<AgencySettings />} />
      </Route>

      <Route
        path="/customer"
        element={
          <ProtectedRoute>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="booking" replace />} />
        <Route path="booking/:bookingId?" element={<CustomerBooking />} />
        <Route path="trip-history" element={<CustomerTripHistory />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
