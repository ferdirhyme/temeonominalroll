import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as api from '../services/supabaseApi';
import { StaffMember } from '../types';
import { ShieldCheckIcon, NoSymbolIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

const AuthorizeTeachers: React.FC = () => {
    const { user } = useAuth();
    const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [selectedStaffUUIDs, setSelectedStaffUUIDs] = useState<Set<string>>(new Set());

    const fetchStaff = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            const staff = await api.getIppdStaffByEmiscodeForAuth(user.emiscode);
            setAllStaff(staff);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch staff for authorization management.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const handleSelectOne = (staffUUID: string) => {
        setSelectedStaffUUIDs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(staffUUID)) {
                newSet.delete(staffUUID);
            } else {
                newSet.add(staffUUID);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStaffUUIDs(new Set(allStaff.map(s => s.id)));
        } else {
            setSelectedStaffUUIDs(new Set());
        }
    };

    const handleAuthorizeSelected = async () => {
        const staffToAuthorize = allStaff.filter(s => selectedStaffUUIDs.has(s.id) && !s.authorised);
        if (staffToAuthorize.length === 0) return;
        
        setActionLoading(true);
        setMessage('');
        setError('');
        
        try {
            await api.authorizeMultipleUsers(staffToAuthorize.map(s => s.staff_id));
            setMessage(`${staffToAuthorize.length} staff member(s) have been successfully authorized.`);
            setSelectedStaffUUIDs(new Set());
            await fetchStaff();
        } catch (err: any) {
            setError(err.message || 'An error occurred during authorization.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevokeSelected = async () => {
        const staffToRevoke = allStaff.filter(s => selectedStaffUUIDs.has(s.id) && s.authorised);
        if (staffToRevoke.length === 0) return;

        if (!window.confirm(`Are you sure you want to revoke authorization for ${staffToRevoke.length} staff member(s)? They will no longer be able to log in.`)) {
            return;
        }

        setActionLoading(true);
        setMessage('');
        setError('');

        try {
            await api.revokeMultipleUsersAuthorization(staffToRevoke.map(s => s.staff_id));
            setMessage(`${staffToRevoke.length} staff member(s) have had their authorization revoked.`);
            setSelectedStaffUUIDs(new Set());
            await fetchStaff();
        } catch (err: any) {
            setError(err.message || 'An error occurred while revoking authorization.');
        } finally {
            setActionLoading(false);
        }
    };

    const { isAllSelected, selectedToAuthorizeCount, selectedToRevokeCount } = useMemo(() => {
        const isAllSelected = allStaff.length > 0 && selectedStaffUUIDs.size === allStaff.length;
        let selectedToAuthorizeCount = 0;
        let selectedToRevokeCount = 0;
        
        allStaff.forEach(staff => {
            if (selectedStaffUUIDs.has(staff.id)) {
                if (staff.authorised) {
                    selectedToRevokeCount++;
                } else {
                    selectedToAuthorizeCount++;
                }
            }
        });
        
        return { isAllSelected, selectedToAuthorizeCount, selectedToRevokeCount };
    }, [allStaff, selectedStaffUUIDs]);


    if (loading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="w-12 h-12 border-4 border-blue-600 border-dashed rounded-full animate-spin"></div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Manage Staff Authorization</h1>
            <p className="text-gray-600">This page lists all staff members in your school. You can grant or revoke their ability to log into the system.</p>
             {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
             {message && <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg">{message}</div>}

            <div className="bg-white p-6 rounded-xl shadow-lg">
                {allStaff.length > 0 ? (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                            <p className="text-sm text-gray-600">
                                {selectedStaffUUIDs.size} of {allStaff.length} selected
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleAuthorizeSelected}
                                    disabled={selectedToAuthorizeCount === 0 || actionLoading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    <ShieldCheckIcon className="h-5 w-5 mr-2" />
                                    Authorize Selected ({selectedToAuthorizeCount})
                                </button>
                                <button
                                    onClick={handleRevokeSelected}
                                    disabled={selectedToRevokeCount === 0 || actionLoading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
                                >
                                    <NoSymbolIcon className="h-5 w-5 mr-2" />
                                    Revoke Selected ({selectedToRevokeCount})
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Authorization Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {allStaff.map((staff) => (
                                        <tr key={staff.id} className={selectedStaffUUIDs.has(staff.id) ? 'bg-blue-50' : ''}>
                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStaffUUIDs.has(staff.id)}
                                                    onChange={() => handleSelectOne(staff.id)}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.staff_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.rank}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {staff.authorised ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                                                        Authorized
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <XCircleIcon className="h-4 w-4 mr-1.5" />
                                                        Not Authorized
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-gray-500 py-8">There are no staff members registered for your school.</p>
                )}
            </div>
        </div>
    );
};

export default AuthorizeTeachers;