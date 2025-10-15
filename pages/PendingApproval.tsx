// Fix: Removed erroneous file header which was causing a parsing error.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/supabaseApi';
import { StaffMember, ApprovalStatus, StaffStatus } from '../types';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import UpdateStatusModal from '../components/UpdateStatusModal';
import { isStandardRank } from '../utils/ranks';
import StaffDetailsModal from '../components/StaffDetailsModal'; // New Import

// Gets the start of the current month in 'YYYY-MM-01' format
const getCurrentMonthStartDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

const PendingApproval: React.FC = () => {
    const { user } = useAuth();
    const [pendingStaff, setPendingStaff] = useState<StaffMember[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    
    const monthYear = useMemo(() => new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), []);

    const fetchPendingStaff = useCallback(async () => {
        if (user) {
            setLoading(true);
            setError('');
            try {
                const currentMonth = getCurrentMonthStartDate();
                const [allStaff, approvals] = await Promise.all([
                    api.getStaffByEmiscode(user.emiscode),
                    api.getMonthlyApprovals(user.emiscode, currentMonth)
                ]);

                const approvedOrDisapprovedIds = new Set(approvals.map(a => a.staff_member_id));
                const staffAwaitingAction = allStaff.filter(s => !approvedOrDisapprovedIds.has(s.id));

                setPendingStaff(staffAwaitingAction);
            } catch (err: any) {
                setError(`Failed to fetch pending staff: ${err.message}`);
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchPendingStaff();
    }, [fetchPendingStaff]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms delay

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    const filteredStaff = useMemo(() => {
        const lowercasedTerm = debouncedSearchTerm.toLowerCase();
        if (!lowercasedTerm) {
            return pendingStaff;
        }
        return pendingStaff.filter(s =>
            s.name.toLowerCase().includes(lowercasedTerm) ||
            s.staff_id.toLowerCase().includes(lowercasedTerm) ||
            (s.rank && s.rank.toLowerCase().includes(lowercasedTerm)) ||
            (s.school && s.school.toLowerCase().includes(lowercasedTerm))
        );
    }, [pendingStaff, debouncedSearchTerm]);


    const handleApprovalAction = async (staffMember: StaffMember, status: ApprovalStatus) => {
        if (!user) return;
        try {
            await api.setMonthlyApproval(staffMember.id, user.emiscode, user.id, status);
            // Refresh the list after an action
            setPendingStaff(prev => prev.filter(s => s.id !== staffMember.id));
            alert(`${staffMember.name} has been marked as ${status}.`);
        } catch (error: any) {
            console.error(`Failed to set status for ${staffMember.name}:`, error);
            alert(`Action Failed: ${error.message || 'An unexpected error occurred.'}`);
        }
    };

    const handleUpdateClick = (staff: StaffMember) => {
        setSelectedStaff(staff);
        setIsModalOpen(true);
    };

    const handleViewClick = (staff: StaffMember) => {
        setSelectedStaff(staff);
        setIsDetailsModalOpen(true);
    };

    const handleSaveChanges = async (staffId: string, status: StaffStatus, description: string) => {
        try {
            await api.updateStaff(staffId, { status, status_desc: description });
            fetchPendingStaff(); // Re-fetch to update the list
            setIsModalOpen(false);
            alert('Status updated successfully!');
        } catch (error: any) {
            console.error("Failed to update staff:", error);
            alert(`Update Failed: ${error.message || 'An unexpected error occurred.'}`);
        }
    };


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Pending Staff Approvals for {monthYear}</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, Staff ID, rank, or school..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>
                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="w-12 h-12 border-4 border-blue-600 border-dashed rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <p className="text-center text-red-600 py-8">{error}</p>
                ) : filteredStaff.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredStaff.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            <span onClick={() => handleViewClick(member)} className="cursor-pointer hover:underline text-blue-600">
                                                {member.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{member.staff_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <span>{member.rank || 'N/A'}</span>
                                                {member.rank && !isStandardRank(member.rank) && (
                                                    <span title="This rank is not standard. Please use the 'Edit Member Record' page to correct it.">
                                                        <ExclamationTriangleIcon className="h-5 w-5 ml-2 text-yellow-500" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                member.status === StaffStatus.AtPost ? 'bg-green-100 text-green-800' :
                                                member.status === StaffStatus.OnLeave ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleUpdateClick(member)}
                                                className="p-2 text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                                                title="Update Status"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleApprovalAction(member, ApprovalStatus.Approved)} 
                                                className="p-2 text-green-600 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                                                title="Approve"
                                            >
                                                <CheckCircleIcon className="h-5 w-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleApprovalAction(member, ApprovalStatus.Disapproved)} 
                                                className="p-2 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                                                title="Disapprove"
                                            >
                                                 <XCircleIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">
                        {debouncedSearchTerm
                            ? 'No staff members found matching your search.'
                            : 'All staff members have been actioned for this month.'}
                    </p>
                )}
            </div>
            <UpdateStatusModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                staffMember={selectedStaff}
                onSave={handleSaveChanges}
            />
            <StaffDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                staffMember={selectedStaff}
            />
        </div>
    );
};

export default PendingApproval;
