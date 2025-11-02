import React from 'react';
import { MonthlyApproval, ApprovalStatus } from '../types';
import { XMarkIcon, CheckBadgeIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

interface ApprovalHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: MonthlyApproval[];
    staffName: string;
}

const ApprovalHistoryModal: React.FC<ApprovalHistoryModalProps> = ({ isOpen, onClose, history, staffName }) => {
    if (!isOpen) return null;

    const formatMonth = (dateString: string) => {
        const date = new Date(dateString);
        // Add timeZone to prevent off-by-one day errors
        return date.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    };

    const StatusIcon: React.FC<{ status: ApprovalStatus }> = ({ status }) => {
        if (status === ApprovalStatus.Approved) {
            return <CheckBadgeIcon className="h-5 w-5 text-green-500" />;
        }
        if (status === ApprovalStatus.Disapproved) {
            return <XCircleIcon className="h-5 w-5 text-red-500" />;
        }
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Approval History for {staffName}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XMarkIcon className="h-6 w-6 text-gray-500" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {history.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {history.map((item) => (
                                <li key={item.id} className="py-4 flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-800">{formatMonth(item.month_start_date)}</span>
                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                        item.status === ApprovalStatus.Approved ? 'bg-green-100 text-green-800' :
                                        item.status === ApprovalStatus.Disapproved ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        <StatusIcon status={item.status} />
                                        {item.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No approval history found for the last 12 months.</p>
                    )}
                </div>
                <div className="mt-auto flex justify-end p-4 border-t bg-gray-50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApprovalHistoryModal;