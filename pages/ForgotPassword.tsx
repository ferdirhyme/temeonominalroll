import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/supabaseApi';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import logo from '../assets/ges-logo.svg';

const Logo = () => (
    <img src={logo} alt="Tema Metro Education Logo" className="mx-auto h-24 w-24 rounded-full" />
);

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await api.requestPasswordReset(email);
            setMessage('Password reset link sent! Please check your email inbox (and spam folder).');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset link. Please check the email address.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Logo />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Forgot Your Password?</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        No problem. Enter your email address and we'll send you a link to reset it.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">{error}</div>}
                        {message && <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg border border-green-200">{message}</div>}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none block w-full px-3 py-3 pl-10 bg-white border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </div>
                    </form>
                </div>
                
                 <p className="mt-8 text-center text-sm text-gray-600">
                    Remember your password?{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline flex items-center justify-center">
                        <ArrowLeftIcon className="mr-1 h-4 w-4" />
                        Back to Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
