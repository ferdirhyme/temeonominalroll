import React, { useState, useEffect } from 'react';
import * as api from '../services/supabaseApi';
import { StaffMember } from '../types';
import { MagnifyingGlassIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { isStandardRank } from '../utils/ranks';
import ExportOptionsModal from '../components/ExportOptionsModal';

interface School {
    emiscode: number;
    school: string;
}

const MetropolisView: React.FC = () => {
    const [schools, setSchools] = useState<School[]>([]);
    const [selectedEmiscode, setSelectedEmiscode] = useState<number | null>(null);
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [loadingSchools, setLoadingSchools] = useState(true);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    useEffect(() => {
        const fetchSchools = async () => {
            setLoadingSchools(true);
            setError('');
            try {
                const schoolData = await api.getDistinctSchools();
                setSchools(schoolData);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch school list.');
            } finally {
                setLoadingSchools(false);
            }
        };
        fetchSchools();
    }, []);

    const handleSchoolChange = async (emiscode: number) => {
        setSelectedEmiscode(emiscode);
        setError('');
        if (emiscode) {
            setLoadingStaff(true);
            setStaffList([]);
            try {
                const staffData = await api.getStaffByEmiscode(emiscode);
                setStaffList(staffData);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch staff for the selected school.');
            } finally {
                setLoadingStaff(false);
            }
        } else {
            setStaffList([]);
        }
    };
    
    const selectedSchoolName = schools.find(s => s.emiscode === selectedEmiscode)?.school;

    const handleExportCSV = (selectedColumns: (keyof StaffMember)[], columnMap: Record<keyof StaffMember, string>) => {
        setIsExportModalOpen(false);
        if (staffList.length === 0 || !selectedSchoolName) return;

        const headers = selectedColumns.map(col => columnMap[col]);
        const csvRows = [headers.join(',')];

        staffList.forEach(member => {
            const values = selectedColumns.map(col => {
                const value = member[col];
                return `"${String(value || '').replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const date = new Date().toISOString().split('T')[0];
        const schoolNameForFile = selectedSchoolName.replace(/ /g, '_');
        link.setAttribute('download', `staff_list_${schoolNameForFile}_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = (selectedColumns: (keyof StaffMember)[], columnMap: Record<keyof StaffMember, string>) => {
        setIsExportModalOpen(false);
        if (staffList.length === 0 || !selectedSchoolName) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const headers = selectedColumns.map(col => `<th>${columnMap[col]}</th>`).join('');

            let tableRows = '';
            staffList.forEach(member => {
                const cells = selectedColumns.map(col => `<td>${member[col] || 'N/A'}</td>`).join('');
                tableRows += `<tr>${cells}</tr>`;
            });

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Staff List - ${selectedSchoolName}</title>
                        <style>
                            body { font-family: sans-serif; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
                            th { background-color: #f2f2f2; }
                            h1 { color: #333; }
                        </style>
                    </head>
                    <body>
                        <h1>Staff List for ${selectedSchoolName}</h1>
                        <p>Total Staff: ${staffList.length}</p>
                        <table>
                            <thead>
                                <tr>${headers}</tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };

    const filteredSchools = schools.filter(school =>
        school.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(school.emiscode).includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Metropolis School View</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Select a School</h2>
                {loadingSchools ? (
                    <p>Loading schools...</p>
                ) : (
                    <div>
                        <label htmlFor="school-search" className="block text-sm font-medium text-gray-700">Filter Schools by Name or Emiscode</label>
                        <div className="relative mt-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                id="school-search"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div className="mt-2 border rounded-md max-h-80 overflow-y-auto">
                            {filteredSchools.length > 0 ? (
                                <ul>
                                    {filteredSchools.map(school => (
                                        <li
                                            key={school.emiscode}
                                            onClick={() => handleSchoolChange(school.emiscode)}
                                            className={`p-3 cursor-pointer hover:bg-blue-50 border-b last:border-b-0 ${selectedEmiscode === school.emiscode ? 'bg-blue-100 text-blue-800 font-semibold' : 'text-gray-900'}`}
                                        >
                                            {school.school} ({school.emiscode})
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="p-3 text-gray-500">No schools found.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

            {selectedEmiscode && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                        <h2 className="text-xl font-semibold text-gray-700">
                            Staff List for {selectedSchoolName}
                        </h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setIsExportModalOpen(true)}
                                disabled={loadingStaff || staffList.length === 0}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                Export Options...
                            </button>
                        </div>
                    </div>
                    {loadingStaff ? (
                         <div className="flex justify-center items-center py-16">
                            <div className="w-12 h-12 border-4 border-blue-600 border-dashed rounded-full animate-spin"></div>
                        </div>
                    ) : staffList.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {staffList.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.staff_id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <span>{member.rank || 'N/A'}</span>
                                                    {member.rank && !isStandardRank(member.rank) && (
                                                        <span title="This rank is not standard.">
                                                            <ExclamationTriangleIcon className="h-5 w-5 ml-2 text-yellow-500" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.status}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.phone || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No staff members found for this school.</p>
                    )}
                </div>
            )}
             <ExportOptionsModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExportCSV={handleExportCSV}
                onExportPrint={handlePrint}
            />
        </div>
    );
};

export default MetropolisView;