import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/supabaseApi';
import { StaffMember } from '../types';
import { PencilSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import EditStaffModal from '../components/EditStaffModal';
import { isStandardRank } from '../utils/ranks';
import StaffDetailsModal from '../components/StaffDetailsModal'; // New Import

const EditStaffRecord: React.FC = () => {
    const { user } = useAuth();
    const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);


    const fetchAllStaff = useCallback(async () => {
        if (user) {
            setLoading(true);
            setError('');
            try {
                const staffData = await api.getStaffByEmiscode(user.emiscode);
                setAllStaff(staffData);
            } catch (err: any) {
                setError(`Failed to fetch staff data: ${err.message}`);
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchAllStaff();
    }, [fetchAllStaff]);

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
        if (!lowercasedTerm) return allStaff;
        return allStaff.filter(s =>
            s.name.toLowerCase().includes(lowercasedTerm) ||
            s.staff_id.toLowerCase().includes(lowercasedTerm) ||
            (s.rank && s.rank.toLowerCase().includes(lowercasedTerm)) ||
            (s.school && s.school.toLowerCase().includes(lowercasedTerm))
        );
    }, [allStaff, debouncedSearchTerm]);

    const handleEditClick = (staff: StaffMember) => {
        setSelectedStaff(staff);
        setIsEditModalOpen(true);
    };

    const handleViewClick = (staff: StaffMember) => {
        setSelectedStaff(staff);
        setIsDetailsModalOpen(true);
    };

    const handleSaveChanges = async (staffUpdates: Partial<StaffMember>) => {
        if (!selectedStaff) return;
        try {
            await api.updateStaff(selectedStaff.id, staffUpdates);
            fetchAllStaff(); // Re-fetch to update the list
            setIsEditModalOpen(false);
            alert('Record updated successfully!');
        } catch (error: any) {
            console.error("Failed to update staff record:", error);
            alert(`Update Failed: ${error.message || 'An unexpected error occurred.'}`);
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Edit Member Records</h1>
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
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <span>{member.rank || 'N/A'}</span>
                                                {member.rank && !isStandardRank(member.rank) && (
                                                    <span title="This rank is not standard. Please edit this record to correct it.">
                                                        <ExclamationTriangleIcon className="h-5 w-5 ml-2 text-yellow-500" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleEditClick(member)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                                                Edit Record
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
                            : 'No staff members found.'}
                    </p>
                )}
            </div>
            
            <EditStaffModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
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

export default EditStaffRecord;
