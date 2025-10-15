import React, { useState, useEffect } from 'react';
import { StaffMember, StaffStatus } from '../types';

interface UpdateStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffMember: StaffMember | null;
    onSave: (staffId: string, status: StaffStatus, description: string) => void;
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({ isOpen, onClose, staffMember, onSave }) => {
    const [status, setStatus] = useState<StaffStatus>(StaffStatus.AtPost);
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (staffMember) {
            setStatus(staffMember.status);
            setDescription(staffMember.status_desc || '');
        }
    }, [staffMember]);

    if (!isOpen || !staffMember) return null;

    const handleSave = () => {
        onSave(staffMember.id, status, description);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Update Status for {staffMember.name}</h3>
                <div className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as StaffStatus)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-900 bg-white"
                        >
                            {Object.values(StaffStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Remarks / Description</label>
                        <textarea
                            id="description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default UpdateStatusModal;
