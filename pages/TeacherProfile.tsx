



import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/supabaseApi';
import { StaffMember } from '../types';
import { PencilSquareIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import TeacherEditInfoModal from '../components/TeacherEditInfoModal';
import { isStandardRank } from '../utils/ranks';

const DetailItem: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
            <span>{value || 'N/A'}</span>
            {label === 'Rank' && value && !isStandardRank(String(value)) && (
                <span title="This rank is not standard. Please contact your administrator to have it corrected.">
                    <ExclamationTriangleIcon className="h-5 w-5 ml-2 text-yellow-500" />
                </span>
            )}
        </dd>
    </div>
);

const TeacherProfile: React.FC = () => {
    const { user } = useAuth();
    const [staffDetails, setStaffDetails] = useState<StaffMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchDetails = useCallback(async () => {
        if (user) {
            setLoading(true);
            setError('');
            try {
                const details = await api.getStaffByStaffId(user.staffId);
                setStaffDetails(details);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch your details.');
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleSaveChanges = async (updates: Partial<StaffMember>) => {
        if (!staffDetails) return;
        try {
            await api.updateStaff(staffDetails.id, updates);
            setIsEditModalOpen(false);
            alert("Your details have been updated successfully.");
            fetchDetails(); // Refresh details
        } catch (error: any) {
            // FIX: Corrected a syntax error in the catch block which was causing multiple cascading errors.
            // The component scope was ending prematurely, making `loading`, `error`, and `staffDetails` inaccessible.
            alert(`Update failed: ${error.message || 'An unexpected error occurred.'}`);
        }
    };

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
    
    if (!staffDetails) {
        return <div className="text-center p-8">Could not find your staff profile.</div>;
    }

    return (
        <div className="space-y-8">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start sm:items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold flex-shrink-0 overflow-hidden">
                                {staffDetails.profile_image_url ? (
                                    <img src={staffDetails.profile_image_url} alt={staffDetails.name} className="w-full h-full object-cover" />
                                ) : (
                                    staffDetails.name.charAt(0)
                                )}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{staffDetails.name}</h3>
                                <div className="flex items-center">
                                    <p className="text-md text-gray-600">{staffDetails.rank}</p>
                                    {staffDetails.rank && !isStandardRank(staffDetails.rank) && (
                                        <span title="This rank is not standard. Please contact your administrator to have it corrected.">
                                            <ExclamationTriangleIcon className="h-5 w-5 ml-2 text-yellow-500" />
                                        </span>
                                     )}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="ml-4 flex-shrink-0 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                           <PencilSquareIcon className="h-4 w-4 mr-2" />
                           Edit My Info
                        </button>
                    </div>
                </div>
                <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Personal & Professional Information</h4>
                     <dl className="divide-y divide-gray-200">
                        <DetailItem label="Current Status" value={staffDetails.status} />
                        <DetailItem label="Staff ID" value={staffDetails.staff_id} />
                        <DetailItem label="School" value={staffDetails.school} />
                        <DetailItem label="Emiscode" value={staffDetails.emiscode} />
                        <DetailItem label="Email" value={staffDetails.email} />
                        <DetailItem label="Phone Number" value={staffDetails.phone} />
                        <DetailItem label="SSNIT Number" value={staffDetails.ssnit} />
                        <DetailItem label="Ghana Card No." value={staffDetails.gh_card} />
                        <DetailItem label="Bank" value={`${staffDetails.bank_name || ''} - ${staffDetails.bank_branch || ''}`} />
                        <DetailItem label="Account Number" value={staffDetails.account} />
                        <DetailItem label="Date of First Appointment" value={staffDetails.date_first_app} />
                        <DetailItem label="Date Posted to Station" value={staffDetails.date_posted_present_sta} />
                    </dl>
                </div>
            </div>

            <TeacherEditInfoModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                staffMember={staffDetails}
                onSave={handleSaveChanges}
            />
        </div>
    );
};

export default TeacherProfile;