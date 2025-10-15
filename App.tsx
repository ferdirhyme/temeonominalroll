import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
// FIX: Use named imports for react-router-dom to resolve module export errors.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ApprovedStaff from './pages/ApprovedStaff';
import PendingApproval from './pages/PendingApproval';
import AddStaff from './pages/AddStaff';
import DisapprovedStaff from './pages/DisapprovedStaff';
import EditStaffRecord from './pages/EditStaffRecord';
import AllMembers from './pages/AllMembers';
import Layout from './components/Layout';
import { UserRole } from './types';
import TeacherProfile from './pages/TeacherProfile';
import AuthorizeTeachers from './pages/AuthorizeTeachers';
import Unauthorized from './pages/Unauthorized';
import Reports from './pages/Reports';
import MetropolisView from './pages/MetropolisView';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="bg-gray-100 min-h-screen font-sans">
        <AppRouter />
      </div>
    </AuthProvider>
  );
};

const AppRouter: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-16 h-16 border-4 border-blue-600 border-dashed rounded-full animate-spin"></div>
            </div>
        );
    }
    
    // This view is shown to teachers who have signed up but have not been authorized by an admin.
    const UnauthorizedTeacherView = () => (
        <Routes>
            <Route path="/" element={<Unauthorized />} />
            {/* Redirect any other attempted path back to the unauthorized page */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );

    // This is the main application view for guests, admins, and authorized teachers.
    const MainAppView = () => (
        <Routes>
            {/* Public routes for unauthenticated users, login is the primary entry point */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />

            {/* Protected routes for authenticated users. All are nested under the Layout component. */}
            <Route element={user ? <Layout /> : <Navigate to="/login" />} >
                <Route path="/dashboard" element={user?.role === UserRole.Teacher ? <TeacherDashboard /> : <AdminDashboard />} />
                
                {/* Admin & Superadmin Routes */}
                <Route path="/approved-staff" element={(user?.role === UserRole.Admin || user?.role === UserRole.Superadmin) ? <ApprovedStaff /> : <Navigate to="/dashboard" />} />
                <Route path="/pending-approval" element={(user?.role === UserRole.Admin || user?.role === UserRole.Superadmin) ? <PendingApproval /> : <Navigate to="/dashboard" />} />
                <Route path="/disapproved-staff" element={(user?.role === UserRole.Admin || user?.role === UserRole.Superadmin) ? <DisapprovedStaff /> : <Navigate to="/dashboard" />} />
                <Route path="/edit-staff-record" element={(user?.role === UserRole.Admin || user?.role === UserRole.Superadmin) ? <EditStaffRecord /> : <Navigate to="/dashboard" />} />
                <Route path="/all-members" element={(user?.role === UserRole.Admin || user?.role === UserRole.Superadmin) ? <AllMembers /> : <Navigate to="/dashboard" />} />
                <Route path="/add-staff" element={(user?.role === UserRole.Admin || user?.role === UserRole.Superadmin) ? <AddStaff /> : <Navigate to="/dashboard" />} />
                <Route path="/authorize-teachers" element={(user?.role === UserRole.Admin || user?.role === UserRole.Superadmin) ? <AuthorizeTeachers /> : <Navigate to="/dashboard" />} />
                <Route path="/reports" element={(user?.role === UserRole.Admin || user?.role === UserRole.Superadmin) ? <Reports /> : <Navigate to="/dashboard" />} />
                <Route path="/metropolis-view" element={user?.role === UserRole.Superadmin ? <MetropolisView /> : <Navigate to="/dashboard" />} />

                {/* Teacher-only Routes */}
                <Route path="/profile" element={user?.role === UserRole.Teacher ? <TeacherProfile /> : <Navigate to="/dashboard" />} />
            </Route>

            {/* Root path and catch-all redirect to login or dashboard */}
            <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
        </Routes>
    );

    return (
        <HashRouter>
            {user && user.role === UserRole.Teacher && !user.authorised
                ? <UnauthorizedTeacherView />
                : <MainAppView />
            }
        </HashRouter>
    );
};


export default App;