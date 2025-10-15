


import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/supabaseApi';
import { StaffMember, StaffStatus } from '../types';
import { RANKS } from '../utils/ranks';
import { UserIcon } from '@heroicons/react/24/solid';

// A helper to create a default state object
const createInitialState = (emiscode: number, school: string, unit: string): Omit<StaffMember, 'id' | 'authorised'> => ({
    staff_id: '',
    name: '',
    email: '',
    school,
    emiscode,
    unit,
    status: StaffStatus.AtPost, // Default status for new staff
    dob: undefined,
    phone: '',
    ssnit: '',
    gh_card: '',
    rank: '',
    bank_name: '',
    bank_branch: '',
    account: '',
    status_desc: '',
    nhis: '',
    ntc_num: '',
    acad_qual: '',
    date_obtained_acad: undefined,
    prof_qual: '',
    date_obtained_prof: undefined,
    level: '',
    subject: '',
    resident_add: '',
    residential_gps: '',
    date_promoted: undefined,
    date_first_app: undefined,
    date_posted_present_sta: undefined,
    phone2: '',
    stafftype: 'Teacher',
});


const AddStaff: React.FC = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState<Omit<StaffMember, 'id' | 'authorised'>>(createInitialState(0, '', ''));
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [adminUnit, setAdminUnit] = useState('');
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            const fetchAdminDetails = async () => {
                try {
                    const adminProfile = await api.getStaffByStaffId(user.staffId);
                    const unit = adminProfile.unit || '';
                    setAdminUnit(unit);
                    // This assumption is based on PullStaff.tsx. A more robust solution might involve
                    // storing school name in the user's profile.
                    const schoolName = adminProfile.school || `Tema Metro School ${user.emiscode}`; 
                    setFormData(createInitialState(user.emiscode, schoolName, unit));
                } catch (error) {
                    console.error("Failed to fetch admin details for form pre-population", error);
                    setIsError(true);
                    setMessage("Could not load admin details to pre-populate the form.");
                }
            };
            fetchAdminDetails();
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        // Handle empty date fields correctly
        const isDate = type === 'date';
        setFormData(prev => ({ ...prev, [name]: isDate && !value ? undefined : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setMessage('Image file size should not exceed 2MB.');
                setIsError(true);
                return;
            }
            setProfileImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        if (!formData.name || !formData.email) {
            setMessage('Full Name and Email are required.');
            setIsError(true);
            return;
        }

        setLoading(true);
        setMessage('');
        setIsError(false);

        const dataToSubmit = { ...formData };

        // Generate temporary ID if staff_id is not provided
        if (!dataToSubmit.staff_id.trim()) {
            dataToSubmit.staff_id = `TEMP-${Date.now()}`;
        }

        try {
            const newStaff = await api.addStaff(dataToSubmit, profileImage || undefined);
            setMessage(`Successfully added ${newStaff.name} (${newStaff.staff_id}). They are now available for monthly approval.`);
            setIsError(false);
            // Reset form
            const schoolName = `Tema Metro School ${user.emiscode}`;
            setFormData(createInitialState(user.emiscode, schoolName, adminUnit));
            setProfileImage(null);
            setImagePreview(null);
        } catch (err: any) {
            setMessage(err.message || 'An error occurred while adding the staff member.');
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    const renderInputField = (label: string, name: keyof Omit<StaffMember, 'id' | 'authorised'>, type: string = 'text', required: boolean = false, disabled: boolean = false) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
            <input
                type={type}
                name={name}
                id={name}
                value={String(formData[name] || '')}
                onChange={handleChange}
                required={required}
                disabled={disabled}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-100"
            />
        </div>
    );
    
    const renderRankDropdown = () => (
        <div>
            <label htmlFor="rank" className="block text-sm font-medium text-gray-700">Rank</label>
            <input
                type="text"
                list="ranks-list"
                id="rank"
                name="rank"
                value={formData.rank || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="Type or select a rank"
            />
            <datalist id="ranks-list">
                {RANKS.map(rank => (
                    <option key={rank} value={rank} />
                ))}
            </datalist>
            <p className="mt-2 text-xs text-gray-500">
                If your rank is not in the list, please type it in full as it appears on your payslip.
            </p>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Add New Staff Member</h1>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-8">

                 {message && (
                    <div className={`p-4 rounded-md text-sm ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}
                
                <fieldset className="border p-4 rounded-md">
                    <legend className="text-base font-medium text-blue-600 px-2">Profile Image</legend>
                    <div className="flex items-center gap-4 mt-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-16 h-16 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <label htmlFor="profile-image-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                                <span>Upload an image</span>
                                <input id="profile-image-upload" name="profile_image" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleImageChange} />
                            </label>
                            <p className="mt-2 text-xs text-gray-500">PNG or JPG up to 2MB.</p>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-md">
                    <legend className="text-base font-medium text-blue-600 px-2">Core Information</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {renderInputField('Full Name', 'name', 'text', true)}
                        {renderInputField('Staff ID (leave blank for temp ID)', 'staff_id', 'text', false)}
                        {renderInputField('Email Address', 'email', 'email', true)}
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-md">
                    <legend className="text-base font-medium text-blue-600 px-2">Personal Details</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {renderInputField('Date of Birth', 'dob', 'date')}
                        {renderInputField('Phone', 'phone')}
                        {renderInputField('Phone 2', 'phone2')}
                        {renderInputField('SSNIT Number', 'ssnit')}
                        {renderInputField('Ghana Card No.', 'gh_card')}
                        {renderInputField('NHIS Number', 'nhis')}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {renderInputField('Residential Address', 'resident_add')}
                        {renderInputField('Residential GPS', 'residential_gps')}
                    </div>
                </fieldset>
                
                <fieldset className="border p-4 rounded-md">
                    <legend className="text-base font-medium text-blue-600 px-2">Professional Details</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {renderRankDropdown()}
                        {renderInputField('Management Unit', 'unit', 'text', false, true)}
                        {renderInputField('Emiscode', 'emiscode', 'number', false, true)}
                        {renderInputField('NTC Number', 'ntc_num')}
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-md">
                    <legend className="text-base font-medium text-blue-600 px-2">Qualifications</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {renderInputField('Academic Qualification', 'acad_qual')}
                        {renderInputField('Date Obtained (Acad.)', 'date_obtained_acad', 'date')}
                        {renderInputField('Professional Qualification', 'prof_qual')}
                        {renderInputField('Date Obtained (Prof.)', 'date_obtained_prof', 'date')}
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-md">
                    <legend className="text-base font-medium text-blue-600 px-2">Appointment Dates</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {renderInputField('Date of Last Promotion', 'date_promoted', 'date')}
                        {renderInputField('Date of First Appointment', 'date_first_app', 'date')}
                        {renderInputField('Date Posted to Station', 'date_posted_present_sta', 'date')}
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-md">
                    <legend className="text-base font-medium text-blue-600 px-2">Bank Details</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {renderInputField('Bank Name', 'bank_name')}
                        {renderInputField('Bank Branch', 'bank_branch')}
                        {renderInputField('Account Number', 'account')}
                    </div>
                </fieldset>
                
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading || !user}
                        className="w-full md:w-auto flex justify-center py-3 px-8 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Adding...' : 'Add Staff Member'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddStaff;