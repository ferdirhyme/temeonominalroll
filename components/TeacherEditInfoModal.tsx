import React, { useState, useEffect } from 'react';
import { StaffMember } from '../types';

interface TeacherEditInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffMember: StaffMember | null;
    onSave: (updates: Partial<StaffMember>) => void;
}

const TeacherEditInfoModal: React.FC<TeacherEditInfoModalProps> = ({ isOpen, onClose, staffMember, onSave }) => {
    const [formData, setFormData] = useState<Partial<StaffMember>>({});

    useEffect(() => {
        if (staffMember) {
            setFormData(staffMember);
        }
    }, [staffMember]);

    if (!isOpen || !staffMember) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const isDate = type === 'date';
        setFormData(prev => ({ ...prev, [name]: isDate && !value ? undefined : value }));
    };

    const handleSave = () => {
        const updates: Partial<StaffMember> = {};
        for (const key in formData) {
            const typedKey = key as keyof StaffMember;
            if (formData[typedKey] !== staffMember[typedKey]) {
                (updates as any)[typedKey] = formData[typedKey];
            }
        }
        onSave(updates);
    };
    
    const renderInputField = (label: string, name: keyof StaffMember, type: string = 'text', disabled: boolean = false) => {
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
                    disabled={disabled}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
            </div>
        );
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <h3 className="text-xl font-medium text-gray-900 p-6 border-b">Edit Your Information</h3>
                <div className="p-6 space-y-6 overflow-y-auto">
                    
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-medium text-gray-500 px-2">Official Records (View Only)</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderInputField('Staff ID', 'staff_id', 'text', true)}
                            {renderInputField('Full Name', 'name', 'text', true)}
                            {renderInputField('Rank', 'rank', 'text', true)}
                            {renderInputField('School', 'school', 'text', true)}
                            {renderInputField('Management Unit', 'unit', 'text', true)}
                            {renderInputField('Emiscode', 'emiscode', 'text', true)}
                            {renderInputField('Status', 'status', 'text', true)}
                            {renderInputField('Staff Type', 'stafftype', 'text', true)}
                        </div>
                    </fieldset>
                    
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-medium text-blue-600 px-2">Personal & Contact Information</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderInputField('Email', 'email', 'email')}
                            {renderInputField('Phone', 'phone')}
                            {renderInputField('Phone 2', 'phone2')}
                            {renderInputField('Date of Birth', 'dob', 'date')}
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {renderInputField('Residential Address', 'resident_add')}
                            {renderInputField('Residential GPS', 'residential_gps')}
                        </div>
                    </fieldset>

                     <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-medium text-blue-600 px-2">Statutory Details</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderInputField('SSNIT Number', 'ssnit')}
                            {renderInputField('Ghana Card No.', 'gh_card')}
                            {renderInputField('NHIS Number', 'nhis')}
                            {renderInputField('NTC Number', 'ntc_num')}
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

                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-medium text-blue-600 px-2">Qualifications & Position</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderInputField('Academic Qualification', 'acad_qual')}
                            {renderInputField('Date Obtained (Acad.)', 'date_obtained_acad', 'date')}
                            {renderInputField('Professional Qualification', 'prof_qual')}
                            {renderInputField('Date Obtained (Prof.)', 'date_obtained_prof', 'date')}
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                             {renderInputField('Level', 'level')}
                             {renderInputField('Subject Taught', 'subject')}
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
                    
                </div>
                <div className="mt-auto flex justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default TeacherEditInfoModal;