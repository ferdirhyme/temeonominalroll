import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/supabaseApi';
import { StaffMember } from '../types';
import { MagnifyingGlassIcon, ArrowDownOnSquareStackIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const PullStaff: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchedStaff, setSearchedStaff] = useState<StaffMember | null>(null);
    const [loading, setLoading] = useState(false);
    const [pulling, setPulling] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [adminDetails, setAdminDetails] = useState<{ school: string; unit?: string } | null>(null);

    // Fetch admin details once on load
    useEffect(() => {
        if (user) {
            const fetchAdminInfo = async () => {
                try {
                    const adminProfile = await api.getStaffByStaffId(user.staffId);
                    setAdminDetails({ school: adminProfile.school, unit: adminProfile.unit });
                } catch (err: any) {
                    setError(`Failed to fetch your admin details: ${err.message}`);
                }
            };
            fetchAdminInfo();
        }
    }, [user]);
    
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !searchTerm.trim()) {
            setError('Please enter a Staff ID to search.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');
        setSearchedStaff(null);

        try {
            const staff = await api.findStaffInMasterList(searchTerm.trim());

            // Add a check to prevent displaying/pulling staff from the same school.
            // This provides immediate feedback to the user after the search.
            if (staff && user.emiscode && staff.emiscode === user.emiscode) {
                setError('This staff member is already assigned to your school.');
                return; 
            }

            setSearchedStaff(staff);
        } catch (err: any) {
            // Robustly get the error message to prevent '[object Object]' errors.
            const errorMessage = err.message || JSON.stringify(err);
            
            if (errorMessage.toLowerCase().includes('not found')) {
                setMessage(`No staff member found with Staff ID: ${searchTerm.trim()}`);
            } else {
                setError(`Error finding staff in master list: ${errorMessage}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePullStaff = async () => {
        if (!user || !adminDetails || !searchedStaff) return;
        if (!window.confirm(`Are you sure you want to pull ${searchedStaff.name} to ${adminDetails.school}?`)) {
            return;
        }

        setPulling(true);
        setError('');
        setMessage('');
        try {
            // Use the new, robust pull function.
            await api.pullStaffFromMasterList(searchedStaff, user.emiscode, adminDetails.school, adminDetails.unit);
            setMessage(`${searchedStaff.name} successfully pulled. They are now pending approval in your school.`);
            setSearchedStaff(null);
            setSearchTerm('');
        } catch (err: any) {
            setError(`Failed to pull staff: ${err.message}`);
        } finally {
            setPulling(false);
        }
    };

    const SearchResultCard = () => {
        if (!searchedStaff) return null;

        return (
            <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Search Result</h3>
                <div className="flex items-start space-x-4">
                    <UserCircleIcon className="h-12 w-12 text-gray-400"/>
                    <div className="flex-1">
                        <p className="font-bold text-gray-900">{searchedStaff.name}</p>
                        <p className="text-sm text-gray-500">Staff ID: {searchedStaff.staff_id}</p>
                        <p className="text-sm text-gray-500">Rank: {searchedStaff.rank || 'N/A'}</p>
                        <p className="text-sm text-gray-500">School: {searchedStaff.school}</p>
                        <p className="text-sm text-gray-500">Management Unit: {searchedStaff.unit || 'N/A'}</p>
                    </div>
                    <button
                        onClick={handlePullStaff}
                        disabled={pulling}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {pulling ? 'Pulling...' : (
                            <>
                                <ArrowDownOnSquareStackIcon className="h-5 w-5 mr-2" />
                                Pull Staff
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Pull Staff from Another School</h1>
            <p className="text-gray-600">
                Enter the Staff ID of the member you wish to transfer to your school. 
                Once pulled, they will appear in your 'Pending Approval' list.
            </p>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <form onSubmit={handleSearch} className="flex items-center space-x-3 max-w-lg">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Enter Staff ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            aria-label="Staff ID"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
            {message && !searchedStaff && <div className="p-3 text-sm text-blue-700 bg-blue-100 rounded-lg">{message}</div>}

            <SearchResultCard />
        </div>
    );
};

export default PullStaff;