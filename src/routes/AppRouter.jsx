import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { getAgencyPanelDefaultPath } from '@/shared/utils/roleHelpers.js'
import ProtectedRoute from '@/routes/ProtectedRoute.jsx'
import AgencyPermissionRoute from '@/routes/AgencyPermissionRoute.jsx'
import AgencyLegacyRedirect from '@/routes/AgencyLegacyRedirect.jsx'

import AgentAdminLogin from '@/auth/pages/AgentAdminLogin.jsx'
import CustomerLogin from '@/auth/pages/Login.jsx'
import ForgotPassword from '@/auth/pages/ForgotPassword.jsx'
import Landing from '@/pages/Landing.jsx'

import ChildAgentRegister from '@/travelAgency/childAgency/auth/Register.jsx'

import ParentAgentRegister from '@/travelAgency/parentAgency/auth/Register.jsx'

import AdminLayout from '@/admin/components/AdminLayout.jsx'
import AdminDashboard from '@/admin/pages/Dashboard.jsx'
import AdminUsers from '@/admin/pages/Users.jsx'
import AdminAgencies from '@/admin/pages/Agencies.jsx'
import AdminSettings from '@/admin/pages/Settings.jsx'
import AdminCustomers from '@/admin/pages/Customers.jsx'
import AdminCustomerDetail from '@/admin/pages/CustomerDetail.jsx'
import AdminPackages from '@/admin/pages/Packages.jsx'
import AdminPackageDetail from '@/admin/pages/PackageDetail.jsx'
import AdminPackageWhitelabels from '@/admin/pages/PackageWhitelabels.jsx'
import AdminPackageBookings from '@/admin/pages/PackageBookings.jsx'
import AdminPackageCommunity from '@/admin/pages/PackageCommunity.jsx'
import AdminAgencyNetwork from '@/admin/pages/AgencyNetwork.jsx'
import AdminChildAgencies from '@/admin/pages/ChildAgencies.jsx'
import AdminAgentWhitelabels from '@/admin/pages/AgentWhitelabels.jsx'
import AdminAgentCustomers from '@/admin/pages/AgentCustomers.jsx'
import AdminAgentParents from '@/admin/pages/AgentParents.jsx'
import AdminNotifications from '@/admin/pages/Notifications.jsx'
import AdminNotificationHistory from '@/admin/pages/NotificationHistory.jsx'
import AdminOtpLogs from '@/admin/pages/OtpLogs.jsx'

import AgencyLayout from '@/travelAgency/shared/components/AgencyLayout.jsx'
import AgencyPanelSidebar from '@/travelAgency/agency/components/AgencyPanelSidebar.jsx'
import AgencyDashboard from '@/travelAgency/agency/pages/AgencyDashboard.jsx'
import AgencyPackages from '@/travelAgency/agency/pages/AgencyPackages.jsx'
import AgencyPackageDetail from '@/travelAgency/agency/pages/AgencyPackageDetail.jsx'
import AgencyPackageCommunity from '@/travelAgency/agency/pages/AgencyPackageCommunity.jsx'
import CreatePackage from '@/travelAgency/parentAgency/pages/CreatePackage.jsx'
import EditPackage from '@/travelAgency/parentAgency/pages/EditPackage.jsx'
import ClonePackage from '@/travelAgency/parentAgency/pages/ClonePackage.jsx'
import AgencyVendors from '@/travelAgency/agency/pages/AgencyVendors.jsx'
import AgencyBookings from '@/travelAgency/agency/pages/AgencyBookings.jsx'
import AgencyMyBookings from '@/travelAgency/agency/pages/AgencyMyBookings.jsx'
import CreateBooking from '@/travelAgency/childAgency/pages/CreateBooking.jsx'
import EditBooking from '@/travelAgency/childAgency/pages/EditBooking.jsx'
import BookingDetail from '@/travelAgency/childAgency/pages/BookingDetail.jsx'
import SubCreateBooking from '@/travelAgency/subChild/pages/CreateBooking.jsx'
import SubEditBooking from '@/travelAgency/subChild/pages/EditBooking.jsx'
import SubBookingDetail from '@/travelAgency/subChild/pages/BookingDetail.jsx'
import AgencyManageDownstream from '@/travelAgency/agency/pages/AgencyManageDownstream.jsx'
import ParentNotificationHistory from '@/travelAgency/parentAgency/pages/ParentNotificationHistory.jsx'
import ChildNotificationHistory from '@/travelAgency/childAgency/pages/ChildNotificationHistory.jsx'
import AgencyCustomerNotificationHistory from '@/travelAgency/agency/pages/AgencyCustomerNotificationHistory.jsx'
import { useAgencyPermissions } from '@/travelAgency/agency/hooks/useAgencyPermissions.js'
import { ROLES } from '@/shared/utils/constants.js'

/** `/agency` index: parents with pending/rejected KYC land on Settings */
function AgencyIndexRedirect() {
  const { user } = useAuth()
  return <Navigate to={getAgencyPanelDefaultPath(user)} replace />
}

function ManageDownstreamNotificationHistory() {
  const { role } = useAgencyPermissions()
  if (role === ROLES.PARENT_AGENCY) return <ParentNotificationHistory />
  if (role === ROLES.CHILD_AGENCY) return <ChildNotificationHistory />
  return null
}
import AgencyCustomers from '@/travelAgency/agency/pages/AgencyCustomers.jsx'
import AgencyCustomerTrips from '@/travelAgency/agency/pages/AgencyCustomerTrips.jsx'
import AgencySettings from '@/travelAgency/agency/pages/AgencySettings.jsx'
import { P } from '@/travelAgency/agency/rbac/agencyPermissions.js'

import CustomerLayout from '@/customer/components/CustomerLayout.jsx'
import CustomerBooking from '@/customer/pages/Booking.jsx'
import BookingCommunity from '@/customer/pages/BookingCommunity.jsx'
import CustomerTripHistory from '@/customer/pages/TripHistory.jsx'
import CustomerProfile from '@/customer/pages/Profile.jsx'
import CustomerCommunity from '@/customer/pages/Community.jsx'
import VendorLogin from '@/vendor/auth/Login.jsx'
import VendorDashboard from '@/vendor/pages/Dashboard.jsx'
import VendorPackageDetails from '@/vendor/pages/PackageDetails.jsx'
import PackageReviewsPage from '@/shared/pages/PackageReviewsPage.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<AgentAdminLogin />} />
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/vendor/login" element={<VendorLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/admin/login" element={<Navigate to="/login" replace />} />

      <Route path="/travelAgency/child/register" element={<ChildAgentRegister />} />

      {/* Parent Auth Routes */}
      <Route path="/travelAgency/parent/login" element={<Navigate to="/login" replace />} />
      <Route path="/travelAgency/parent/register" element={<ParentAgentRegister />} />
      <Route path="/agency/login" element={<Navigate to="/login" replace />} />

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
        <Route path="packages/:packageId/community" element={<AdminPackageCommunity />} />
        <Route path="packages/:packageId/reviews" element={<PackageReviewsPage />} />
        <Route path="packages" element={<AdminPackages />} />
        <Route path="packages/:packageId/detail" element={<AdminPackageDetail />} />
        <Route path="agencies" element={<AdminAgencies />} />
        <Route path="agencies/network/:parentId" element={<AdminAgencyNetwork />} />
        <Route path="child-agencies/:agentId/whitelabels" element={<AdminAgentWhitelabels />} />
        <Route path="sub-child-agencies/:agentId/whitelabels" element={<AdminAgentWhitelabels />} />
        <Route path="child-agencies/:agentId/customers" element={<AdminAgentCustomers />} />
        <Route path="sub-child-agencies/:agentId/customers" element={<AdminAgentCustomers />} />
        <Route path="child-agencies/:agentId/parents" element={<AdminAgentParents />} />
        <Route path="sub-child-agencies/:agentId/parents" element={<AdminAgentParents />} />
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
        <Route path="notifications/history" element={<AdminNotificationHistory />} />
        <Route path="otp-logs" element={<AdminOtpLogs />} />
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
        <Route index element={<AgencyIndexRedirect />} />
        <Route
          path="dashboard"
          element={
            <AgencyPermissionRoute permission={P.DASHBOARD}>
              <AgencyDashboard />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="packages"
          element={
            <AgencyPermissionRoute anyOf={[P.PACKAGES_FULL, P.PACKAGES_CLONE]}>
              <AgencyPackages />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="packages/create"
          element={
            <AgencyPermissionRoute permission={P.PACKAGES_FULL}>
              <CreatePackage />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="packages/edit/:id"
          element={
            <AgencyPermissionRoute permission={P.PACKAGES_FULL}>
              <EditPackage />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="packages/clone/:id"
          element={
            <AgencyPermissionRoute anyOf={[P.PACKAGES_FULL, P.PACKAGES_CLONE]}>
              <ClonePackage />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="packages/:packageId/community"
          element={
            <AgencyPermissionRoute anyOf={[P.PACKAGES_FULL, P.PACKAGES_CLONE]}>
              <AgencyPackageCommunity />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="packages/:packageId/reviews"
          element={
            <AgencyPermissionRoute anyOf={[P.PACKAGES_FULL, P.PACKAGES_CLONE]}>
              <PackageReviewsPage />
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
          path="bookings/create"
          element={
            <AgencyPermissionRoute anyOf={[P.BOOKINGS_NETWORK, P.BOOKINGS_SALES]}>
              <CreateBooking />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="bookings/:id"
          element={
            <AgencyPermissionRoute anyOf={[P.BOOKINGS_NETWORK, P.BOOKINGS_SALES]}>
              <BookingDetail />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="bookings/:id/edit"
          element={
            <AgencyPermissionRoute anyOf={[P.BOOKINGS_NETWORK, P.BOOKINGS_SALES]}>
              <EditBooking />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="bookings/create"
          element={
            <AgencyPermissionRoute anyOf={[P.BOOKINGS_NETWORK, P.BOOKINGS_SALES]}>
              <CreateBooking />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="bookings/edit/:id"
          element={
            <AgencyPermissionRoute anyOf={[P.BOOKINGS_NETWORK, P.BOOKINGS_SALES]}>
              <EditBooking />
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
          path="my-bookings/create"
          element={
            <AgencyPermissionRoute permission={P.BOOKINGS_OWN}>
              <SubCreateBooking />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="my-bookings/:id"
          element={
            <AgencyPermissionRoute permission={P.BOOKINGS_OWN}>
              <SubBookingDetail />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="my-bookings/edit/:id"
          element={
            <AgencyPermissionRoute permission={P.BOOKINGS_OWN}>
              <SubEditBooking />
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
          path="manage-downstream/notification-history"
          element={
            <AgencyPermissionRoute anyOf={[P.NETWORK_CHILDREN, P.NETWORK_SUBCHILDREN]}>
              <ManageDownstreamNotificationHistory />
            </AgencyPermissionRoute>
          }
        />
        <Route
          path="customers/notification-history"
          element={
            <AgencyPermissionRoute permission={P.CUSTOMERS}>
              <AgencyCustomerNotificationHistory />
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

      <Route path="/vendor" element={<Navigate to="/vendor/dashboard" replace />} />
      <Route
        path="/vendor/dashboard"
        element={
          <ProtectedRoute>
            <VendorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/package/:packageId"
        element={
          <ProtectedRoute>
            <VendorPackageDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer"
        element={
          <ProtectedRoute>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="booking" replace />} />
        <Route path="booking/:bookingId/community" element={<BookingCommunity />} />
        <Route path="booking/:bookingId/reviews/:packageId" element={<PackageReviewsPage />} />
        <Route path="booking/:bookingId?" element={<CustomerBooking />} />
        <Route path="trip-history" element={<CustomerTripHistory />} />
        <Route path="community" element={<CustomerCommunity />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
