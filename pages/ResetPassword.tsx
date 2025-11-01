import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/supabaseApi';
import { supabase } from '../supabase';
import { LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const Logo = () => (
    <img src="/assets/ges-logo.svg" alt="Tema Metro Education Logo" className="mx-auto h-24 w-24 rounded-full" />
);

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasRecoveryToken, setHasRecoveryToken] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase sends a `PASSWORD_RECOVERY` event when the user lands on this page from the reset link.
        // This event provides a temporary session that allows updating the password.
        const { data: authListener } = (supabase.auth as any).onAuthStateChange((event: string, session: any) => {
            if (event === 'PASSWORD_RECOVERY') {
                setHasRecoveryToken(true);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setError('');
        setMessage('');
        setLoading(true);

        try {
            await api.updateUserPassword(password);
            setMessage('Your password has been reset successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };
    
    if (!hasRecoveryToken) {
         // Show a loading/checking state initially before deciding the token is invalid.
        return (
            <div className="min-h-screen flex flex-col justify-center items-center p-4">
                 <div className="w-full max-w-md text-center">
                     <Logo />
                     <h2 className="mt-6 text-2xl font-bold text-gray-900">Validating Reset Link...</h2>
                     <p className="mt-4 text-gray-600">
                         If you did not receive a reset link, please request one from the "Forgot Password" page. If this message persists, your link may be invalid or expired.
                     </p>
                 </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Logo />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Set a New Password</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Please enter your new password below.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">{error}</div>}
                        {message && <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg border border-green-200 flex items-center"><CheckCircleIcon className="h-5 w-5 mr-2" />{message}</div>}

                        {!message && (
                            <>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        New Password
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            className="appearance-none block w-full px-3 py-3 pl-10 bg-white border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                                        Confirm New Password
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </div>
                                        <input
                                            id="confirm-password"
                                            name="confirm-password"
                                            type="password"
                                            required
                                            className="appearance-none block w-full px-3 py-3 pl-10 bg-white border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
                                    >
                                        {loading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
