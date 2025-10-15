





import React from 'react';
// FIX: Use named import for react-router-dom to resolve module export errors.
import { Outlet } from 'react-router-dom';
import AdminSidebar from './Sidebar'; // This is the existing admin sidebar
import TeacherSidebar from './TeacherSidebar'; // The new teacher sidebar
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

const Layout: React.FC = () => {
    const { user } = useAuth();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    // Determine which sidebar to show based on user role
    const SidebarComponent = (user?.role === UserRole.Admin || user?.role === UserRole.Superadmin) ? AdminSidebar : TeacherSidebar;

    return (
        <div className="flex h-screen bg-gray-100">
            {/* The sidebar is rendered for both admins and teachers */}
            <SidebarComponent isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8 lg:p-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;