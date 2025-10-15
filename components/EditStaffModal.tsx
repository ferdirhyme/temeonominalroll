


import React, { useState, useEffect } from 'react';
import { StaffMember } from '../types';
import { RANKS } from '../utils/ranks';
import { UserIcon } from '@heroicons/react/24/solid';
import * as api from '../services/supabaseApi';

interface EditStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffMember: StaffMember | null;
    onSave: (updates: Partial<StaffMember>) => void | Promise<void>;
}

const EditStaffModal: React.FC<EditStaffModalProps> = ({ isOpen, onClose, staffMember, onSave }) => {
    const [formData, setFormData] = useState<Partial<StaffMember>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (staffMember) {
            setFormData(staffMember);
            setImagePreview(staffMember.profile_image_url || null);
            setImageFile(null);
            setError('');
        }
    }, [staffMember]);

    if (!isOpen || !staffMember) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isDate = e.target.type === 'date';
        setFormData(prev => ({ ...prev, [name]: isDate && !value ? undefined : value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
             if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('Image file size should not exceed 2MB.');
                return;
            }
            setError('');
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!staffMember) return;
        setIsSaving(true);
        setError('');
        const updatesToSave = { ...formData };

        try {
            // If a new image was selected, upload it first
            if (imageFile) {
                const newImageUrl = await api.uploadProfileImage(imageFile, staffMember.staff_id);
                updatesToSave.profile_image_url = newImageUrl;
            }
            
            await onSave(updatesToSave);
        } catch (err: any) {
            // The parent component will show an alert, but we can set an error here too.
            setError(err.message || 'An unexpected error occurred during save.');
            console.error("Save failed in modal:", err);
        } finally {
            setIsSaving(false);
        }
    };
    
    const renderInputField = (label: string, name: keyof StaffMember, type: string = 'text') => {
        let value = String(formData[name] || '');
        if (type === 'date' && value) {
            // An <input type="date"> requires "YYYY-MM-DD" format.
            // This handles cases where the date from the DB includes a time part (e.g., "1990-05-15T00:00:00").
            value = value.split('T')[0];
        }
    
        return (
            <div>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
                <input
                    type={type}
                    name={name}
                    id={name}
                    value={value}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                />
            </div>
        );
    };

    const renderRankDropdown = () => (
        <div>
            <label htmlFor="rank" className="block text-sm font-medium text-gray-700">Rank</label>
            <input
                type="text"
                list="ranks-list-modal"
                id="rank"
                name="rank"
                value={formData.rank || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="Type or select a rank"
            />
            <datalist id="ranks-list-modal">
                {RANKS.map(rank => (
                    <option key={rank} value={rank} />
                ))}
            </datalist>
            <p className="mt-2 text-xs text-gray-500">
                If the rank is not in the list, please type it in full as it appears on the payslip.
            </p>
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <h3 className="text-xl font-medium text-gray-900 p-6 border-b">Edit Record for {staffMember.name}</h3>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-medium text-blue-600 px-2">Profile Image</legend>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-16 h-16 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <label htmlFor="profile-image-upload-modal" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                                    <span>Change image</span>
                                    <input id="profile-image-upload-modal" name="profile_image" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleImageChange} />
                                </label>
                                <p className="mt-2 text-xs text-gray-500">PNG or JPG up to 2MB.</p>
                            </div>
                        </div>
                    </fieldset>
                    
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-medium text-blue-600 px-2">Core Information</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderInputField('Staff ID', 'staff_id')}
                            {renderInputField('Full Name', 'name')}
                            {renderInputField('Email', 'email', 'email')}
                        </div>
                    </fieldset>

                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-medium text-blue-600 px-2">Personal Details</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <legend className="text-sm font-medium text-blue-600 px-2">Professional Details</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderRankDropdown()}
                            {renderInputField('Management Unit', 'unit')}
                            {renderInputField('NTC Number', 'ntc_num')}
                        </div>
                    </fieldset>
                    
                     <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-medium text-blue-600 px-2">Qualifications</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderInputField('Academic Qualification', 'acad_qual')}
                            {renderInputField('Date Obtained (Acad.)', 'date_obtained_acad', 'date')}
                            {renderInputField('Professional Qualification', 'prof_qual')}
                            {renderInputField('Date Obtained (Prof.)', 'date_obtained_prof', 'date')}
                        </div>
                    </fieldset>

                     <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-medium text-blue-600 px-2">Appointment Dates</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderInputField('Date of Last Promotion', 'date_promoted', 'date')}
                            {renderInputField('Date of First Appointment', 'date_first_app', 'date')}
                            {renderInputField('Date Posted to Station', 'date_posted_present_sta', 'date')}
                        </div>
                    </fieldset>
                    
                     <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-medium text-blue-600 px-2">Bank Details</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderInputField('Bank Name', 'bank_name')}
                            {renderInputField('Bank Branch', 'bank_branch')}
                            {renderInputField('Account Number', 'account')}
                        </div>
                    </fieldset>

                </div>
                <div className="mt-auto flex justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditStaffModal;