import React from 'react';
// FIX: Use named import for react-router-dom to resolve module export errors.
import { NavLink } from 'react-router-dom';
import { HomeIcon, UserPlusIcon, CheckBadgeIcon, ExclamationTriangleIcon, XMarkIcon, NoSymbolIcon, PencilSquareIcon, UsersIcon, ShieldCheckIcon, DocumentChartBarIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}


const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const { user } = useAuth();
    const navLinkClasses = "flex items-center px-4 py-3 text-gray-200 hover:bg-blue-700 hover:text-white rounded-lg transition-colors duration-200";
    const activeNavLinkClasses = "bg-blue-700 text-white";

    return (
        <>
            <div className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={() => setIsOpen(false)}></div>
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-blue-800 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:static lg:translate-x-0`}>
                <div className="relative p-4 border-b border-blue-700">
                    <div className="flex flex-col items-center w-full pt-4 pb-2">
                        <img src="/assets/ges-logo.svg" alt="GES Logo" className="h-16 w-16 rounded-full mb-2" />
                        <h2 className="text-sm font-semibold text-center text-blue-100">Tema Metro Education Directorate</h2>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white lg:hidden">
                        <XMarkIcon className="h-6 w-6"/>
                    </button>
                </div>
                <nav className="p-4 space-y-2">
                    <NavLink to="/dashboard" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <HomeIcon className="h-6 w-6 mr-3" /> Dashboard
                    </NavLink>
                    <NavLink to="/approved-staff" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                         <CheckBadgeIcon className="h-6 w-6 mr-3" /> Approved Staff
                    </NavLink>
                    <NavLink to="/pending-approval" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                         <ExclamationTriangleIcon className="h-6 w-6 mr-3" /> Pending Approval
                    </NavLink>
                    <NavLink to="/disapproved-staff" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <NoSymbolIcon className="h-6 w-6 mr-3" /> Disapproved Staff
                    </NavLink>
                    <NavLink to="/all-members" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <UsersIcon className="h-6 w-6 mr-3" /> All Members
                    </NavLink>
                    <NavLink to="/add-staff" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <UserPlusIcon className="h-6 w-6 mr-3" /> Add Staff
                    </NavLink>
                    <NavLink to="/authorize-teachers" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <ShieldCheckIcon className="h-6 w-6 mr-3" /> Manage Authorization
                    </NavLink>
                    <NavLink to="/reports" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <DocumentChartBarIcon className="h-6 w-6 mr-3" /> Reports
                    </NavLink>
                    {user?.role === UserRole.Superadmin && (
                        <NavLink to="/metropolis-view" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                            <BuildingLibraryIcon className="h-6 w-6 mr-3" /> Metropolis View
                        </NavLink>
                    )}
                     <NavLink to="/edit-staff-record" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <PencilSquareIcon className="h-6 w-6 mr-3" /> Edit Member Record
                    </NavLink>
                </nav>
            </div>
        </>
    );
};

export default Sidebar;