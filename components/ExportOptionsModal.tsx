import React, { useState, useMemo } from 'react';
import { StaffMember } from '../types';

interface ExportOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExportCSV: (selectedColumns: (keyof StaffMember)[], columnMap: Record<keyof StaffMember, string>) => void;
    onExportPrint: (selectedColumns: (keyof StaffMember)[], columnMap: Record<keyof StaffMember, string>) => void;
}

const COLUMN_MAP: Record<keyof StaffMember, string> = {
    id: 'Row ID',
    staff_id: 'Staff ID',
    name: 'Name',
    dob: 'Date of Birth',
    phone: 'Phone',
    ssnit: 'SSNIT',
    gh_card: 'Ghana Card',
    rank: 'Rank',
    unit: 'Management Unit',
    school: 'School',
    emiscode: 'Emiscode',
    bank_name: 'Bank Name',
    bank_branch: 'Bank Branch',
    account: 'Account Number',
    status: 'Status',
    status_desc: 'Status Description',
    nhis: 'NHIS',
    ntc_num: 'NTC Number',
    acad_qual: 'Academic Qualification',
    date_obtained_acad: 'Date Obtained (Acad.)',
    prof_qual: 'Professional Qualification',
    date_obtained_prof: 'Date Obtained (Prof.)',
    level: 'Level',
    subject: 'Subject',
    resident_add: 'Residential Address',
    residential_gps: 'Residential GPS',
    email: 'Email',
    date_promoted: 'Date of Last Promotion',
    date_first_app: 'Date of First Appointment',
    date_posted_present_sta: 'Date Posted to Station',
    phone2: 'Phone 2',
    authorised: 'Authorised',
    // FIX: Added missing 'profile_image_url' to satisfy the Record<keyof StaffMember, string> type.
    profile_image_url: 'Profile Image URL',
    stafftype: 'Staff Type',
};

const EXPORTABLE_COLUMNS = Object.keys(COLUMN_MAP).filter(
    key => key !== 'id' && key !== 'authorised'
) as (keyof StaffMember)[];


const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({ isOpen, onClose, onExportCSV, onExportPrint }) => {
    const [selectedColumns, setSelectedColumns] = useState<(keyof StaffMember)[]>([]);

    const handleToggleColumn = (columnKey: keyof StaffMember) => {
        setSelectedColumns(prev => 
            prev.includes(columnKey) ? prev.filter(c => c !== columnKey) : [...prev, columnKey]
        );
    };

    const handleSelectAll = () => {
        setSelectedColumns(EXPORTABLE_COLUMNS);
    };
    
    const handleDeselectAll = () => {
        setSelectedColumns([]);
    };

    const sortedColumns = useMemo(() => {
        return [...EXPORTABLE_COLUMNS].sort((a, b) => COLUMN_MAP[a].localeCompare(COLUMN_MAP[b]));
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h3 className="text-xl font-medium text-gray-900">Export Options</h3>
                    <p className="text-sm text-gray-500 mt-1">Select the columns you want to include in your export.</p>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-700">{selectedColumns.length} of {EXPORTABLE_COLUMNS.length} selected</span>
                        <div className="flex space-x-2">
                            <button onClick={handleSelectAll} className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">Select All</button>
                            <button onClick={handleDeselectAll} className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Deselect All</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {sortedColumns.map(columnKey => (
                            <label key={columnKey} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    checked={selectedColumns.includes(columnKey)}
                                    onChange={() => handleToggleColumn(columnKey)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-800 select-none">{COLUMN_MAP[columnKey]}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="mt-auto flex justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                    <button 
                        type="button" 
                        onClick={() => onExportPrint(selectedColumns, COLUMN_MAP)}
                        disabled={selectedColumns.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Print / PDF
                    </button>
                     <button 
                        type="button" 
                        onClick={() => onExportCSV(selectedColumns, COLUMN_MAP)}
                        disabled={selectedColumns.length === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Export CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportOptionsModal;