
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlusIcon, IdentificationIcon, EnvelopeIcon, LockClosedIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const Logo = () => (
    <img src="/assets/ges-logo.svg" alt="Tema Metro Education Logo" className="mx-auto h-24 w-24 rounded-full" />
);

const Signup: React.FC = () => {
    const [staffId, setStaffId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emiscode, setEmiscode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!staffId || !email || !password || !emiscode) {
            setError('All fields are required.');
            setLoading(false);
            return;
        }

        try {
            await signup({ staffId, email, password, emiscode: parseInt(emiscode) });
            alert("Signup successful! Please check your email to confirm your account. You can then log in.");
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Failed to sign up. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Logo />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Get started by providing your details below.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">{error}</div>}
                        
                        <InputField label="Staff ID" name="staffId" type="text" value={staffId} onChange={setStaffId} placeholder="e.g., 123456" Icon={IdentificationIcon} />
                        <InputField label="Email Address" name="email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" Icon={EnvelopeIcon} />
                        <InputField label="Password" name="password" type="password" value={password} onChange={setPassword} placeholder="••••••••" Icon={LockClosedIcon} />
                        <InputField label="Emiscode (School Code)" name="emiscode" type="number" value={emiscode} onChange={setEmiscode} placeholder="e.g., 7890" Icon={BuildingOfficeIcon} />

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
                            >
                                {loading ? 'Creating account...' : 'Create Account'}
                                {!loading && <UserPlusIcon className="ml-2 h-5 w-5" />}
                            </button>
                        </div>
                    </form>
                </div>
                
                <p className="mt-8 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                        Sign in instead
                    </Link>
                </p>
                <p className="mt-4 text-center text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} Tema Metro Education. All rights reserved.
                </p>
            </div>
        </div>
    );
};

// Helper component for form fields to reduce repetition
interface InputFieldProps {
    label: string;
    name: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, type, value, onChange, placeholder, Icon }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
            {label}
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
                id={name}
                name={name}
                type={type}
                required
                className="appearance-none block w-full px-3 py-3 pl-10 bg-white border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    </div>
);

export default Signup;