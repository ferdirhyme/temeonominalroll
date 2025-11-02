import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bars3Icon, ArrowRightOnRectangleIcon, UserCircleIcon, ChevronDownIcon, KeyIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import logo from '../src/assets/ges-logo.svg'; // import logo

interface HeaderProps {
    toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="flex items-center justify-between p-4 bg-white shadow-md">
            <div className="flex items-center">
                <button onClick={toggleSidebar} className="text-gray-600 focus:outline-none lg:hidden">
                    <Bars3Icon className="h-6 w-6" />
                </button>

                {/* Logo */}
                {/* <img src={logo} alt="Logo" className="w-12 h-12 mr-4" /> */}

                <h1 className="text-xl font-semibold text-gray-800">Tema Metro Staff Nominal Roll</h1>
            </div>

            <div className="flex items-center space-x-4">
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 cursor-pointer p-1 rounded-lg hover:bg-gray-100"
                    >
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
                        <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="py-1">
                                <Link
                                    to="/change-password"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <KeyIcon className="h-5 w-5 mr-3 text-gray-500" />
                                    Change Password
                                </Link>
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        logout();
                                    }}
                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
