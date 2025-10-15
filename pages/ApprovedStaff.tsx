// Fix: Removed erroneous file header which was causing a parsing error.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/supabaseApi';
import { StaffMember, StaffStatus, ApprovalStatus } from '../types';
import { PencilIcon, MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import UpdateStatusModal from '../components/UpdateStatusModal';
import { useSearchParams } from 'react-router-dom';
import { isStandardRank } from '../utils/ranks';
import StaffDetailsModal from '../components/StaffDetailsModal'; // New Import

// Gets the start of the current month in 'YYYY-MM-01' format
const getCurrentMonthStartDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

const StaffTable: React.FC<{ staff: StaffMember[]; onUpdate: (staff: StaffMember) => void; onView: (staff: StaffMember) => void }> = ({ staff, onUpdate, onView }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {staff.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <span onClick={() => onView(member)} className="cursor-pointer hover:underline text-blue-600">
                                    {member.name}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.staff_id}</td>
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
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => onUpdate(member)} className="text-blue-600 hover:text-blue-900 flex items-center ml-auto">
                                    <PencilIcon className="h-5 w-5 mr-1"/> Update Status
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const ApprovedStaff: React.FC = () => {
    const { user } = useAuth();
    const [approvedStaff, setApprovedStaff] = useState<StaffMember[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const statusFilter = searchParams.get('status');
    
    const monthYear = useMemo(() => new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), []);

    const fetchApprovedStaff = useCallback(async () => {
        if (user) {
            setLoading(true);
            setError('');
            try {
                const currentMonth = getCurrentMonthStartDate();
                const allStaffInSchool = await api.getStaffByEmiscode(user.emiscode);
                const approvals = await api.getMonthlyApprovals(user.emiscode, currentMonth);

                const approvedStaffIds = new Set(
                    approvals
                        .filter(a => a.status === ApprovalStatus.Approved)
                        .map(a => a.staff_member_id)
                );

                setApprovedStaff(allStaffInSchool.filter(s => approvedStaffIds.has(s.id)));

            } catch (err) {
                setError('Failed to fetch approved staff data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchApprovedStaff();
    }, [fetchApprovedStaff]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms delay

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);
    
    const filteredStaff = useMemo(() => {
        let staffToFilter = approvedStaff;

        if (statusFilter) {
            staffToFilter = staffToFilter.filter(s => s.status === statusFilter);
        }

        const lowercasedTerm = debouncedSearchTerm.toLowerCase();
        if (!lowercasedTerm) {
            return staffToFilter;
        }

        return staffToFilter.filter(s =>
            s.name.toLowerCase().includes(lowercasedTerm) ||
            s.staff_id.toLowerCase().includes(lowercasedTerm) ||
            (s.rank && s.rank.toLowerCase().includes(lowercasedTerm)) ||
            (s.school && s.school.toLowerCase().includes(lowercasedTerm))
        );
    }, [approvedStaff, debouncedSearchTerm, statusFilter]);

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
            fetchApprovedStaff(); // Re-fetch to update the list
            setIsModalOpen(false);
            alert('Status updated successfully!');
        } catch (error: any) {
            console.error("Failed to update staff:", error);
            alert(`Update Failed: ${error.message || 'An unexpected error occurred.'}`);
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Approved Staff for {monthYear}</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                {statusFilter && (
                    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded-r-lg" role="alert">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold">Filtering by "{statusFilter}"</p>
                            </div>
                            <button
                                onClick={() => setSearchParams({})}
                                className="p-1 rounded-full hover:bg-blue-200"
                                aria-label="Clear filter"
                            >
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                )}
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
                    <StaffTable staff={filteredStaff} onUpdate={handleUpdateClick} onView={handleViewClick} />
                ) : (
                    <p className="text-center text-gray-500 py-8">
                        {debouncedSearchTerm || statusFilter
                            ? 'No staff members found matching your filters.'
                            : 'No staff members have been approved for this month.'}
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

export default ApprovedStaff;
