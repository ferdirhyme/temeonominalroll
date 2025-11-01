import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/supabaseApi';
import { KeyIcon } from '@heroicons/react/24/outline';

const ChangePassword = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }
        if (!user) {
            setError('You must be logged in to change your password.');
            return;
        }

        setLoading(true);
        try {
            await api.changeUserPassword(user.email, currentPassword, newPassword);
            // On success, immediately log out and navigate to the login page with a success message.
            await logout();
            navigate('/login', { 
                replace: true, 
                state: { message: 'Password updated successfully! Please log in with your new credentials.' } 
            });
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            setLoading(false); // Only set loading to false on error, as success navigates away.
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Change Password</h1>
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">{error}</div>}
                    
                    <fieldset disabled={loading}>
                        <div>
                            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                                Current Password
                            </label>
                            <input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                                New Password
                            </label>
                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                                Confirm New Password
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                            />
                        </div>
                    </fieldset>

                     <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                        >
                            <KeyIcon className="h-5 w-5 mr-2" />
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;