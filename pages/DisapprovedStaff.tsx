

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/supabaseApi';
import { StaffMember, ApprovalStatus } from '../types';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { isStandardRank } from '../utils/ranks';
import StaffDetailsModal from '../components/StaffDetailsModal'; // New Import

// Gets the start of the current month in 'YYYY-MM-01' format
const getCurrentMonthStartDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

const DisapprovedStaff: React.FC = () => {
    const { user } = useAuth();
    const [disapprovedStaff, setDisapprovedStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

    const monthYear = useMemo(() => new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), []);

    const fetchDisapprovedStaff = useCallback(async () => {
        if (user) {
            setLoading(true);
            setError('');
            try {
                const currentMonth = getCurrentMonthStartDate();
                const allStaffInSchool = await api.getStaffByEmiscode(user.emiscode);
                const approvals = await api.getMonthlyApprovals(user.emiscode, currentMonth);

                const disapprovedStaffIds = new Set(
                    approvals
                        .filter(a => a.status === ApprovalStatus.Disapproved)
                        .map(a => a.staff_member_id)
                );

                setDisapprovedStaff(allStaffInSchool.filter(s => disapprovedStaffIds.has(s.id)));

            } catch (err: any) {
                setError(`Failed to fetch disapproved staff: ${err.message}`);
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchDisapprovedStaff();
    }, [fetchDisapprovedStaff]);

    const handleViewClick = (staff: StaffMember) => {
        setSelectedStaff(staff);
        setIsDetailsModalOpen(true);
    };

    const handleChangeToApproved = async (staffMember: StaffMember) => {
        if (!user) return;
        try {
            await api.setMonthlyApproval(staffMember.id, user.emiscode, user.id, ApprovalStatus.Approved);
            // Refresh the list after an action by filtering out the now-approved staff member
            setDisapprovedStaff(prev => prev.filter(s => s.id !== staffMember.id));
            alert(`${staffMember.name}'s status has been changed to 'Approved'.`);
        } catch (error: any) {
            console.error(`Failed to approve ${staffMember.name}:`, error);
            alert(`Action Failed: ${error.message || 'An unexpected error occurred.'}`);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Disapproved Staff for {monthYear}</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="w-12 h-12 border-4 border-blue-600 border-dashed rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <p className="text-center text-red-600 py-8">{error}</p>
                ) : disapprovedStaff.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {disapprovedStaff.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            <span onClick={() => handleViewClick(member)} className="cursor-pointer hover:underline text-blue-600">
                                                {member.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{member.staff_id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <span>{member.rank || 'N/A'}</span>
                                                {member.rank && !isStandardRank(member.rank) && (
                                                    <span title="This rank is not standard. Please use the 'Edit Member Record' page to correct it.">
                                                        <ExclamationTriangleIcon className="h-5 w-5 ml-2 text-yellow-500" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleChangeToApproved(member)} 
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                title="Change to Approved"
                                            >
                                                <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                                                Approve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">No staff members have been disapproved for this month.</p>
                )}
            </div>
            <StaffDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                staffMember={selectedStaff}
            />
        </div>
    );
};

export default DisapprovedStaff;
