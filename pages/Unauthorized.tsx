import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRightOnRectangleIcon, ClockIcon } from '@heroicons/react/24/outline';

const Unauthorized: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
             <header className="flex items-center justify-between p-4 bg-white shadow-md">
                <h1 className="text-xl font-semibold text-gray-800">Tema Metro Staff Nominal Roll</h1>
                {user && (
                    <button
                        onClick={logout}
                        className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                        Logout
                    </button>
                )}
            </header>
            <main className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-lg p-8 text-center bg-white rounded-2xl shadow-xl">
                    <ClockIcon className="mx-auto h-16 w-16 text-yellow-500" />
                    <h2 className="mt-6 text-2xl font-bold text-gray-900">Account Pending Approval</h2>
                    <p className="mt-4 text-gray-600">
                        Hello, <strong>{user?.name}</strong>. Thank you for signing up.
                    </p>
                    <p className="mt-2 text-gray-600">
                        Your account is currently awaiting authorization from a school administrator. You will be able to access your dashboard once your account has been approved.
                    </p>
                    <p className="mt-4 text-sm text-gray-500">
                        If you believe this is an error, please contact your headteacher.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Unauthorized;
