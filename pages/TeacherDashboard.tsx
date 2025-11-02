import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/supabaseApi';
import { StaffMember, MonthlyApproval, ApprovalStatus } from '../types';
import { CheckBadgeIcon, XCircleIcon, ClockIcon, UserCircleIcon, EyeIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';
// FIX: Use named import for react-router-dom to resolve module export errors.
import { Link } from 'react-router-dom';
import ApprovalHistoryModal from '../components/ApprovalHistoryModal';

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
    const [showApprovalNotification, setShowApprovalNotification] = useState(false);
    
    // New state for history modal
    const [approvalHistory, setApprovalHistory] = useState<MonthlyApproval[]>([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);


    const monthYear = useMemo(() => new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), []);

    const fetchDashboardData = useCallback(async () => {
        if (user) {
            setLoading(true);
            setError('');
            try {
                // First, fetch the full staff profile to get the correct database ID (`ippd.id`)
                const details = await api.getStaffByStaffId(user.staffId);
                setStaffDetails(details);
                
                // Now use the correct ID to fetch the monthly approval status
                if (details) {
                    const status = await api.getStaffMemberMonthlyApproval(details.id, getCurrentMonthStartDate());
                    setMonthlyStatus(status);
                }
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

    useEffect(() => {
        if (user) {
            const statusKey = `user_status_${user.id}`;
            if (localStorage.getItem(statusKey) === 'pending') {
                setShowApprovalNotification(true);
                localStorage.removeItem(statusKey);
            }
        }
    }, [user]);

    const handleShowHistory = async () => {
        if (!staffDetails) return; // Use staffDetails which contains the correct ID
        setHistoryLoading(true);
        setIsHistoryModalOpen(true);
        try {
            // Use the correct staff record ID from the details object
            const history = await api.getStaffMemberApprovalHistory(staffDetails.id);
            setApprovalHistory(history);
        } catch (err) {
            console.error("Failed to fetch approval history:", err);
            // In a real app, you might set an error state for the modal here
        } finally {
            setHistoryLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-16 h-16 border-4 border-blue-600 border-dashed rounded-full animate-spin"></div>
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
            {showApprovalNotification && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-md relative" role="alert">
                    <div className="flex items-center">
                        <CheckBadgeIcon className="h-8 w-8 text-green-500 mr-4 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-lg">Account Approved!</p>
                            <p className="text-sm">Welcome! Your account has been successfully authorized. You can now access all features.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowApprovalNotification(false)} 
                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-green-200 transition-colors"
                        aria-label="Dismiss"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
            )}

            <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name}!</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white shadow-xl rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-semibold text-gray-800">Monthly Status for {monthYear}</h2>
                            <button
                                onClick={handleShowHistory}
                                disabled={historyLoading}
                                className="inline-flex items-center text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
                            >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                {historyLoading ? 'Loading...' : 'View History'}
                            </button>
                        </div>
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
            
            <ApprovalHistoryModal 
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                history={approvalHistory}
                staffName={user?.name || ''}
            />
        </div>
    );
};

export default TeacherDashboard;