import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as api from '../services/supabaseApi';
import { StaffMember, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { MagnifyingGlassIcon, ArrowDownOnSquareStackIcon, ArrowUturnLeftIcon, CakeIcon, ArrowDownTrayIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { isStandardRank } from '../utils/ranks';
import StaffDetailsModal from '../components/StaffDetailsModal'; // New Import

const PAGE_SIZE = 20;

interface PullHistoryItem {
  id: string; // staff member's row id
  pulledName: string;
  originalData: {
    emiscode: number;
    school: string;
    unit?: string;
  };
  pulledToSchool: string;
  timestamp: string; // ISO string
}


const AllMembers: React.FC = () => {
    const { user } = useAuth();
    const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    
    // State for pull functionality
    const [selectedStaffForAction, setSelectedStaffForAction] = useState<StaffMember | null>(null);
    const [adminDetails, setAdminDetails] = useState<{ school: string; unit?: string; emiscode: number } | null>(null);
    const [pullHistory, setPullHistory] = useState<PullHistoryItem[]>([]);
    const [isConfirmingPull, setIsConfirmingPull] = useState(false);
    const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);

    // State for retirements
    const [retiringStaff, setRetiringStaff] = useState<StaffMember[]>([]);
    const [retirementsLoading, setRetirementsLoading] = useState(true);
    
    // State for details modal
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedStaffForView, setSelectedStaffForView] = useState<StaffMember | null>(null);


    // Fetch admin details for pull action
    useEffect(() => {
        if (user) {
            const fetchAdminInfo = async () => {
                try {
                    const adminProfile = await api.getStaffByStaffId(user.staffId);
                    setAdminDetails({ 
                        school: adminProfile.school, 
                        unit: adminProfile.unit,
                        emiscode: user.emiscode
                    });
                } catch (err) {
                    setError("Failed to fetch your admin details. Cannot perform pull actions.");
                }
            };
            fetchAdminInfo();
        }
    }, [user]);

     // Fetch retiring staff for the admin's specific school
    useEffect(() => {
        if (user) {
            const fetchRetirements = async () => {
                setRetirementsLoading(true);
                try {
                    const schoolStaff = await api.getStaffByEmiscode(user.emiscode);
                    
                    const today = new Date();
                    const oneYearFromNow = new Date();
                    oneYearFromNow.setFullYear(today.getFullYear() + 1);

                    const staffNearingRetirement = schoolStaff
                        .filter(member => {
                            if (!member.dob) return false;
                            const dob = new Date(member.dob);
                            if (isNaN(dob.getTime())) return false;

                            const retirementDate = new Date(dob);
                            retirementDate.setFullYear(dob.getFullYear() + 60);

                            return retirementDate >= today && retirementDate <= oneYearFromNow;
                        })
                        .sort((a, b) => {
                            const retirementDateA = new Date(a.dob!);
                            retirementDateA.setFullYear(retirementDateA.getFullYear() + 60);
                            const retirementDateB = new Date(b.dob!);
                            retirementDateB.setFullYear(retirementDateB.getFullYear() + 60);
                            return retirementDateA.getTime() - retirementDateB.getTime();
                        });
                    
                    setRetiringStaff(staffNearingRetirement);

                } catch (err) {
                    // Non-critical error, so we don't block the main page function
                    console.error("Could not fetch retirement data:", err);
                } finally {
                    setRetirementsLoading(false);
                }
            };
            fetchRetirements();
        }
    }, [user]);

    // Load pull history from localStorage on initial render
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('pullHistory');
            if (storedHistory) {
                setPullHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Failed to parse pull history from localStorage", error);
            localStorage.removeItem('pullHistory'); // Clear corrupted data
        }
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { staff, hasNextPage: newHasNextPage } = await api.getAllIppdStaff(
                currentPage,
                PAGE_SIZE,
                debouncedSearchTerm
            );
            setAllStaff(staff);
            setHasNextPage(newHasNextPage);
        } catch (err: any) {
            setError(`Failed to fetch staff data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(0); // Reset to first page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handlePullRequest = () => {
        if (!selectedStaffForAction || !adminDetails) return;
        setIsConfirmingPull(true);
    };

    const handleArchiveRequest = () => {
        if (!selectedStaffForAction || !user) return;
        setIsConfirmingArchive(true);
    };
    
    const handleViewClick = (staff: StaffMember) => {
        setSelectedStaffForView(staff);
        setIsDetailsModalOpen(true);
    };

    const handleConfirmPull = async () => {
        if (!selectedStaffForAction || !adminDetails) return;

        setIsConfirmingPull(false);
        setIsActionLoading(true);
        setError('');

        try {
            const originalData = {
                emiscode: selectedStaffForAction.emiscode,
                school: selectedStaffForAction.school,
                unit: selectedStaffForAction.unit,
            };
            
            await api.updateStaff(selectedStaffForAction.id, {
                emiscode: adminDetails.emiscode,
                school: adminDetails.school,
                unit: adminDetails.unit,
            });

            const newHistoryItem: PullHistoryItem = {
              id: selectedStaffForAction.id,
              pulledName: selectedStaffForAction.name,
              originalData: originalData,
              pulledToSchool: adminDetails.school,
              timestamp: new Date().toISOString(),
            };

            const updatedHistory = [newHistoryItem, ...pullHistory].slice(0, 10); // Keep last 10
            setPullHistory(updatedHistory);
            localStorage.setItem('pullHistory', JSON.stringify(updatedHistory));
            
            setSelectedStaffForAction(null);
            await fetchData();
        } catch (err: any) {
            setError(`Failed to pull staff: ${err.message}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleConfirmArchive = async () => {
        if (!selectedStaffForAction) return;

        setIsConfirmingArchive(false);
        setIsActionLoading(true);
        setError('');

        try {
            await api.archiveStaff(selectedStaffForAction.id);
            alert(`${selectedStaffForAction.name} has been successfully archived.`);
            setSelectedStaffForAction(null);
            await fetchData(); // Refresh list
        } catch (err: any) {
            setError(`Failed to archive staff: ${err.message}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUndoPull = async (itemToUndo: PullHistoryItem) => {
        if (!itemToUndo) return;
        
        setIsActionLoading(true);
        setError('');

        try {
            await api.updateStaff(itemToUndo.id, itemToUndo.originalData);
            
            const updatedHistory = pullHistory.filter(item => item.timestamp !== itemToUndo.timestamp);
            setPullHistory(updatedHistory);
            localStorage.setItem('pullHistory', JSON.stringify(updatedHistory));

            await fetchData();
        } catch (err: any) {
            setError(`Failed to undo pull: ${err.message}`);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleExportRetirements = () => {
        if (retiringStaff.length === 0) {
            alert("No retirement data to export.");
            return;
        }

        const headers = ['Name', 'Staff ID', 'Rank', 'Date of Birth', 'Retirement Date'];
        const csvRows = [headers.join(',')];

        retiringStaff.forEach(member => {
            const dob = new Date(member.dob!);
            const retirementDate = new Date(dob);
            retirementDate.setFullYear(dob.getFullYear() + 60);

            const row = [
                member.name,
                member.staff_id,
                member.rank || 'N/A',
                // Use en-CA for YYYY-MM-DD format which is CSV-friendly
                dob.toLocaleDateString('en-CA'),
                retirementDate.toLocaleDateString('en-CA')
            ];
            
            const values = row.map(val => `"${String(val || '').replace(/"/g, '""')}"`);
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `upcoming_retirements_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isPullButtonDisabled = !selectedStaffForAction || isActionLoading || (selectedStaffForAction && adminDetails && selectedStaffForAction.emiscode === adminDetails.emiscode);
    const isArchiveButtonDisabled = !selectedStaffForAction || isActionLoading || (user?.role === UserRole.Admin && selectedStaffForAction.emiscode !== user.emiscode) || (user && selectedStaffForAction && selectedStaffForAction.staff_id === user.staffId);
    
    const RetirementsSection = () => (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-700 flex items-center">
                    <CakeIcon className="h-6 w-6 mr-3 text-yellow-500" />
                    Upcoming Retirements at Your School (Next 12 Months)
                </h2>
                <button
                    onClick={handleExportRetirements}
                    disabled={retirementsLoading || retiringStaff.length === 0}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    title="Export Retirements List"
                >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Export
                </button>
            </div>
            {retirementsLoading ? (
                 <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-gray-300 border-dashed rounded-full animate-spin"></div>
                </div>
            ) : retiringStaff.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date of Birth</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Retirement Date</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-gray-200">
                            {retiringStaff.map(member => {
                                const retirementDate = new Date(member.dob!);
                                retirementDate.setFullYear(retirementDate.getFullYear() + 60);
                                return (
                                    <tr key={member.id}>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{member.name}</td>
                                        <td className="px-4 py-2 text-sm text-gray-500">{member.rank}</td>
                                        <td className="px-4 py-2 text-sm text-gray-500">{new Date(member.dob!).toLocaleDateString('en-GB')}</td>
                                        <td className="px-4 py-2 text-sm font-semibold text-red-600">{retirementDate.toLocaleDateString('en-GB')}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-500 py-8 mt-2">No staff members are scheduled for retirement in the next 12 months.</p>
            )}
        </div>
    );

    const renderContent = () => {
        if (error) {
            return <p className="text-center text-red-600 py-8">{error}</p>;
        }

        return (
            <div className="relative min-h-[400px]">
                {(loading || isActionLoading) && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                        <div className="w-12 h-12 border-4 border-blue-600 border-dashed rounded-full animate-spin"></div>
                    </div>
                )}
                
                {allStaff.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Management Unit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {allStaff.map((member) => (
                                        <tr key={member.id} className={`hover:bg-gray-50 ${selectedStaffForAction?.id === member.id ? 'bg-blue-50' : ''}`}>
                                            <td className="px-4 py-4">
                                                <input
                                                    type="radio"
                                                    name="selectedStaff"
                                                    checked={selectedStaffForAction?.id === member.id}
                                                    onChange={() => setSelectedStaffForAction(member)}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                />
                                            </td>
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
                                            <td className="px-6 py-4 text-sm text-gray-500">{member.school}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{member.unit || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <button
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={currentPage === 0 || loading || isActionLoading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-700">Page {currentPage + 1}</span>
                            <button
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={!hasNextPage || loading || isActionLoading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </>
                ) : (
                    !loading && (
                        <p className="text-center text-gray-500 py-8">
                            {debouncedSearchTerm
                                ? 'No staff members found matching your search.'
                                : 'No staff members found.'}
                        </p>
                    )
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">All Members</h1>
            
            <RetirementsSection />

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Search and Pull Staff</h2>
                <div className="md:flex justify-between items-center mb-4 space-y-4 md:space-y-0">
                    <div className="relative w-full max-w-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, Staff ID, school, or rank..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                        <button
                            onClick={handlePullRequest}
                            disabled={isPullButtonDisabled}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <ArrowDownOnSquareStackIcon className="h-5 w-5 mr-2" />
                            Pull Selected Staff
                        </button>
                        <button
                            onClick={handleArchiveRequest}
                            disabled={isArchiveButtonDisabled}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <ArchiveBoxIcon className="h-5 w-5 mr-2" />
                            Archive Selected Staff
                        </button>
                    </div>
                </div>

                {pullHistory.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg my-4 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Pulls</h3>
                        <ul className="divide-y divide-gray-200">
                            {pullHistory.map((item) => (
                                <li key={item.timestamp} className="py-3 flex justify-between items-center flex-wrap gap-2">
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            Pulled <strong>{item.pulledName}</strong> from {item.originalData.school}.
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            On {new Date(item.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleUndoPull(item)}
                                        disabled={isActionLoading}
                                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
                                        Undo
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {renderContent()}
            </div>
            
            {isConfirmingPull && selectedStaffForAction && adminDetails && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center">
                        <h3 className="text-lg font-semibold text-gray-900">Confirm Staff Pull</h3>
                        <p className="mt-4 text-gray-600">
                            Are you sure you want to pull <strong className="font-bold">{selectedStaffForAction.name}</strong> to <strong className="font-bold">{adminDetails.school}</strong>?
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            This action will update their school record. They will then need to be approved for the current month.
                        </p>
                        <div className="mt-6 flex justify-center space-x-4">
                            <button
                                onClick={() => setIsConfirmingPull(false)}
                                disabled={isActionLoading}
                                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPull}
                                disabled={isActionLoading}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                            >
                                {isActionLoading ? 'Pulling...' : 'Confirm Pull'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isConfirmingArchive && selectedStaffForAction && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mt-3">Confirm Staff Archive</h3>
                        <p className="mt-4 text-gray-600">
                            Are you sure you want to archive <strong className="font-bold">{selectedStaffForAction.name}</strong>?
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            This action will remove them from all active lists (dashboards, approvals, etc.). This should be used for staff who have retired, resigned, or otherwise permanently left the service. They can be restored later from the 'Archived Staff' page.
                        </p>
                        <div className="mt-6 flex justify-center space-x-4">
                            <button
                                onClick={() => setIsConfirmingArchive(false)}
                                disabled={isActionLoading}
                                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmArchive}
                                disabled={isActionLoading}
                                className="px-6 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:bg-red-400"
                            >
                                {isActionLoading ? 'Archiving...' : 'Confirm Archive'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
             <StaffDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                staffMember={selectedStaffForView}
            />
        </div>
    );
};

export default AllMembers;