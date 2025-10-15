




import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/supabaseApi';
import { StaffMember, MonthlyApproval, ApprovalStatus } from '../types';
import { CheckBadgeIcon, XCircleIcon, ClockIcon, UserCircleIcon } from '@heroicons/react/24/solid';
// FIX: Use named import for react-router-dom to resolve module export errors.
import { Link } from 'react-router-dom';

// Gets the start of the current month in 'YYYY-MM-01' format
const getCurrentMonthStartDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

const TeacherDashboard: React.FC = () => {
    const { user } = useAuth();
    const [staffDetails, setStaffDetails] = useState<StaffMember | null>(null);
    const [monthlyStatus, setMonthlyStatus] = useState<MonthlyApproval | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const monthYear = useMemo(() => new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), []);

    const fetchDashboardData = useCallback(async () => {
        if (user) {
            setLoading(true);
            setError('');
            try {
                // Fetch both in parallel
                const [details, status] = await Promise.all([
                    api.getStaffByStaffId(user.staffId),
                    api.getStaffMemberMonthlyApproval(user.id, getCurrentMonthStartDate())
                ]);
                setStaffDetails(details);
                setMonthlyStatus(status);

            } catch (err: any) {
                setError(err.message || 'Failed to fetch your dashboard data.');
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="w-10 h-10 border-4 border-blue-600 border-dashed rounded-full animate-spin"></div>
            </div>
        );
    }
    
    if (error) {
         return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;
    }
    
    const renderStatus = () => {
        if (monthlyStatus?.status === ApprovalStatus.Approved) {
            return (
                <div className="flex items-center space-x-3 text-green-600">
                    <CheckBadgeIcon className="h-8 w-8"/>
                    <span className="text-xl font-semibold">Approved</span>
                </div>
            );
        }
        if (monthlyStatus?.status === ApprovalStatus.Disapproved) {
             return (
                <div className="flex items-center space-x-3 text-red-600">
                    <XCircleIcon className="h-8 w-8"/>
                    <span className="text-xl font-semibold">Disapproved</span>
                </div>
            );
        }
        return (
            <div className="flex items-center space-x-3 text-yellow-600">
                <ClockIcon className="h-8 w-8"/>
                <span className="text-xl font-semibold">Pending</span>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name}!</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white shadow-xl rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Monthly Status for {monthYear}</h2>
                        <p className="text-sm text-gray-500 mb-6">This is your official status for the current month's payroll approval.</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg flex items-center justify-center">
                        {renderStatus()}
                    </div>
                </div>

                <div className="bg-white shadow-xl rounded-2xl p-6">
                     <h2 className="text-xl font-semibold text-gray-800 mb-4">My Profile</h2>
                     <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold flex-shrink-0">
                            {staffDetails?.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-lg text-gray-900">{staffDetails?.name}</p>
                            <p className="text-md text-gray-600">{staffDetails?.rank}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">View your full profile or update your contact and bank information.</p>
                    <Link 
                        to="/profile"
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                       <UserCircleIcon className="h-5 w-5 mr-2" />
                       View & Edit My Profile
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;