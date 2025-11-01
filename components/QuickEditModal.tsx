import React, { useState, useEffect } from 'react';
import { StaffMember, StaffStatus } from '../types';
import { RANKS } from '../utils/ranks';

interface QuickEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffMember: StaffMember | null;
    onSave: (updates: Partial<StaffMember>) => void | Promise<void>;
}

const QuickEditModal: React.FC<QuickEditModalProps> = ({ isOpen, onClose, staffMember, onSave }) => {
    const [formData, setFormData] = useState<Partial<StaffMember>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (staffMember) {
            setFormData({
                rank: staffMember.rank,
                status: staffMember.status,
                phone: staffMember.phone,
            });
        }
    }, [staffMember]);

    if (!isOpen || !staffMember) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error("Save failed in quick edit modal:", error);
            // Parent component is responsible for showing user-facing alerts
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-medium text-gray-900 p-6 border-b">Quick Edit for {staffMember.name}</h3>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="rank-quick" className="block text-sm font-medium text-gray-700">Rank</label>
                        <input
                            type="text"
                            list="ranks-list-quick-modal"
                            id="rank-quick"
                            name="rank"
                            value={formData.rank || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                            placeholder="Type or select a rank"
                        />
                        <datalist id="ranks-list-quick-modal">
                            {RANKS.map(rank => (
                                <option key={rank} value={rank} />
                            ))}
                        </datalist>
                    </div>

                    <div>
                        <label htmlFor="status-quick" className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            id="status-quick"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-gray-900 bg-white"
                        >
                            {Object.values(StaffStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="phone-quick" className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            id="phone-quick"
                            value={formData.phone || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                    </div>

                </div>
                <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-lg">
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

export default QuickEditModal;
