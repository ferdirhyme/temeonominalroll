import React from 'react';
import { StaffMember } from '../types';
import { XMarkIcon, UserIcon, AtSymbolIcon, PhoneIcon, BriefcaseIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface StaffDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffMember: StaffMember | null;
}

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value?: string | number }> = ({ icon, label, value }) => (
    <div className="flex items-start py-2">
        <div className="flex-shrink-0 w-6 h-6 text-gray-500">{icon}</div>
        <div className="ml-3">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-base font-medium text-gray-800">{value || 'N/A'}</p>
        </div>
    </div>
);

const StaffDetailsModal: React.FC<StaffDetailsModalProps> = ({ isOpen, onClose, staffMember }) => {
    if (!isOpen || !staffMember) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative transform transition-all duration-300 ease-in-out scale-95 animate-modal-enter">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
                
                <div className="p-6">
                    <div className="flex items-center space-x-5">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {staffMember.profile_image_url ? (
                                <img src={staffMember.profile_image_url} alt={staffMember.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-16 h-16 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{staffMember.name}</h3>
                            <p className="text-md text-gray-600">{staffMember.rank || 'Rank not specified'}</p>
                             <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                staffMember.status === 'AT POST' ? 'bg-green-100 text-green-800' :
                                staffMember.status === 'ON LEAVE' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {staffMember.status}
                            </span>
                        </div>
                    </div>
                    
                    <div className="mt-6 border-t border-gray-200 pt-4">
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">Contact & School Details</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                            <DetailRow icon={<AtSymbolIcon />} label="Email" value={staffMember.email} />
                            <DetailRow icon={<PhoneIcon />} label="Phone" value={staffMember.phone} />
                            <DetailRow icon={<BriefcaseIcon />} label="Staff ID" value={staffMember.staff_id} />
                            <DetailRow icon={<MapPinIcon />} label="School" value={staffMember.school} />
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 rounded-b-xl text-right">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
            {/* FIX: Removed invalid 'jsx' prop from <style> tag to resolve a TypeScript error. 
                This syntax is for Next.js (styled-jsx) and is not supported in a standard React setup. 
                Using a regular <style> tag achieves the same goal of injecting CSS for the animation. */}
             <style>{`
                @keyframes modal-enter {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-modal-enter {
                    animation: modal-enter 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default StaffDetailsModal;
