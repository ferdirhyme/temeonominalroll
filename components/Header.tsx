

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bars3Icon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { UserRole } from '../types';

interface HeaderProps {
    toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();

    return (
        <header className="flex items-center justify-between p-4 bg-white shadow-md">
            <div className="flex items-center">
                 <button onClick={toggleSidebar} className="text-gray-600 focus:outline-none lg:hidden">
                    <Bars3Icon className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold text-gray-800 ml-4">Tema Metro Staff Nominal Roll</h1>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                        {user?.profile_image_url ? (
                            <img src={user.profile_image_url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <UserCircleIcon className="h-8 w-8 text-blue-600" />
                        )}
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="font-semibold text-gray-700">{user?.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{user?.role} View</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors duration-200"
                >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Logout
                </button>
            </div>
        </header>
    );
};

export default Header;