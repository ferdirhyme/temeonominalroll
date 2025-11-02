import React from 'react';
// FIX: Use named import for react-router-dom to resolve module export errors.
import { NavLink } from 'react-router-dom';
import { HomeIcon, UserCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

import logo from '../src/assets/ges-logo.svg';


const Logo = () => (
    <img src={logo} alt="Tema Metro Education Logo" className="h-16 w-16 rounded-full mb-2" />
);

interface TeacherSidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ isOpen, setIsOpen }) => {
    const navLinkClasses = "flex items-center px-4 py-3 text-gray-200 hover:bg-blue-700 hover:text-white rounded-lg transition-colors duration-200";
    const activeNavLinkClasses = "bg-blue-700 text-white";

    return (
        <>
            <div className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden ${isOpen ? 'block' : 'hidden'}`} onClick={() => setIsOpen(false)}></div>
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-blue-800 text-white transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:static lg:translate-x-0`}>
                <div className="relative p-4 border-b border-blue-700">
                    <div className="flex flex-col items-center w-full pt-4 pb-2">
                        <Logo />
                        <h2 className="text-sm font-semibold text-center text-blue-100">Tema Metro Education Directorate</h2>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white lg:hidden">
                        <XMarkIcon className="h-6 w-6"/>
                    </button>
                </div>
                <nav className="p-4 space-y-2">
                    <NavLink to="/dashboard" end className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                        <HomeIcon className="h-6 w-6 mr-3" /> Dashboard
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeNavLinkClasses : ''}`}>
                         <UserCircleIcon className="h-6 w-6 mr-3" /> My Profile
                    </NavLink>
                </nav>
            </div>
        </>
    );
};

export default TeacherSidebar;