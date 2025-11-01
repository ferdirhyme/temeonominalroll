import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/supabaseApi';
import { StaffMember, UserRole } from '../types';
import { MagnifyingGlassIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

const ArchivedStaff: React.FC = () => {
    const { user } = useAuth();
    const [archivedStaff, setArchivedStaff] = useState<StaffMember[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // Store ID of member being actioned
    const [error, setError] = useState('');
    
    const fetchArchivedStaff = useCallback(async () => {
        if (user) {
            setLoading(true);
            setError('');
            try {
                const staffData = user.role === UserRole.Superadmin
                    ? await api.getAllArchivedStaffGlobally()
                    : await api.getArchivedStaffByEmiscode(user.emiscode);
                setArchivedStaff(staffData);
            } catch (err: any) {
                setError('Failed to fetch archived staff data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchArchivedStaff();
    }, [fetchArchivedStaff]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);
    
    const filteredStaff = useMemo(() => {
        const lowercasedTerm = debouncedSearchTerm.toLowerCase();
        if (!lowercasedTerm) {
            return archivedStaff;
        }

        return archivedStaff.filter(s =>
            s.name.toLowerCase().includes(lowercasedTerm) ||
            s.staff_id.toLowerCase().includes(lowercasedTerm) ||
            (s.rank && s.rank.toLowerCase().includes(lowercasedTerm)) ||
            (s.school && s.school.toLowerCase().includes(lowercasedTerm))
        );
    }, [archivedStaff, debouncedSearchTerm]);

    const handleRestore = async (staff: StaffMember) => {
        if (!window.confirm(`Are you sure you want to restore ${staff.name} to active status?`)) {
            return;
        }
        setActionLoading(staff.id);
        try {
            await api.unarchiveStaff(staff.id);
            alert(`${staff.name} has been restored.`);
            fetchArchivedStaff(); // Re-fetch to update the list
        } catch (error: any) {
            console.error("Failed to restore staff:", error);
            alert(`Restore Failed: ${error.message || 'An unexpected error occurred.'}`);
        } finally {
            setActionLoading(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Archived Staff Members</h1>
            <p className="text-gray-600">This list contains staff members who have been archived and are no longer active. You can restore them if needed.</p>
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
                                    {user?.role === UserRole.Superadmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>}
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredStaff.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.staff_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.rank || 'N/A'}</td>
                                        {user?.role === UserRole.Superadmin && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.school}</td>}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => handleRestore(member)}
                                                disabled={actionLoading === member.id}
                                                className="inline-flex items-center text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-wait"
                                            >
                                                {actionLoading === member.id ? 'Restoring...' : <> <ArrowUturnLeftIcon className="h-5 w-5 mr-1"/> Restore from Archive </> }
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
                            ? 'No archived staff members found matching your search.'
                            : 'There are no archived staff members.'}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ArchivedStaff;
