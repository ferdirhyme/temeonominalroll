import React, { useState, useMemo, useCallback, useEffect } from 'react';
import * as api from '../services/supabaseApi';
import { StaffMember, MonthlyApproval, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
    ArrowPathIcon, 
    DocumentArrowDownIcon, 
    BuildingOffice2Icon, 
    CakeIcon,
    UsersIcon,
    AcademicCapIcon,
    ArrowTrendingDownIcon,
    ClipboardDocumentCheckIcon,
    PrinterIcon,
    TableCellsIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/solid';

type ReportType = 
    | 'metropolis-summary' 
    | 'retirement-forecast' 
    | 'demographics'
    | 'qualifications'
    | 'attrition'
    | 'data-audit'
    | 'nominal-roll'
    | 'full-export'
    | null;

// Helper to calculate age from date string
const calculateAge = (dobString?: string): number | null => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};

// Helper to calculate years of service
const calculateServiceYears = (firstAppointmentDate?: string): number | null => {
    if (!firstAppointmentDate) return null;
    const startDate = new Date(firstAppointmentDate);
    if (isNaN(startDate.getTime())) return null;
    const today = new Date();
    let years = today.getFullYear() - startDate.getFullYear();
    const m = today.getMonth() - startDate.getMonth();
    // FIX: Corrected variable from `dob` to `startDate` to resolve a reference error.
    if (m < 0 || (m === 0 && today.getDate() < startDate.getDate())) {
        years--;
    }
    return Math.max(0, years);
}

// Generic counter helper
const countItems = (staff: StaffMember[], key: keyof StaffMember) => {
    return staff.reduce((acc, member) => {
        const item = member[key] as string | undefined;
        if (item) {
            acc[item] = (acc[item] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
};


const Reports: React.FC = () => {
    const { user } = useAuth();
    const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
    const [allApprovals, setAllApprovals] = useState<MonthlyApproval[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeReport, setActiveReport] = useState<ReportType>(null);
    const [nominalRollDate, setNominalRollDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const fetchAllStaffData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            const staffData = user.role === UserRole.Superadmin
                ? await api.getAllStaffGlobally()
                : await api.getStaffByEmiscode(user.emiscode);
            setAllStaff(staffData);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch staff data for reports.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // Debounce delay

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    // Memoized calculations for each report
    const metropolisSummary = useMemo(() => {
        if (allStaff.length === 0 || user?.role !== UserRole.Superadmin) return null;
        const summary = allStaff.reduce((acc, staff) => {
            const school = staff.school || 'Unknown School';
            if (!acc[school]) {
                acc[school] = { total: 0, atPost: 0, onLeave: 0, transferred: 0, vacated: 0 };
            }
            acc[school].total++;
            if (staff.status === 'AT POST') acc[school].atPost++;
            else if (staff.status === 'ON LEAVE') acc[school].onLeave++;
            else if (staff.status === 'TRANSFERRED') acc[school].transferred++;
            else if (staff.status === 'VACATED POST') acc[school].vacated++;
            return acc;
        }, {} as Record<string, { total: number; atPost: number; onLeave: number; transferred: number; vacated: number }>);
        return Object.entries(summary).sort(([schoolA], [schoolB]) => schoolA.localeCompare(schoolB));
    }, [allStaff, user]);
    
    const retirementForecast = useMemo(() => {
        if (allStaff.length === 0) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const twelveMonthsFromNow = new Date(today);
        twelveMonthsFromNow.setFullYear(today.getFullYear() + 1);

        let retiringStaff = allStaff
            .filter(member => {
                if (!member.dob || !/^\d{4}-\d{2}-\d{2}$/.test(member.dob)) return false;

                const [year, month, day] = member.dob.split('-').map(Number);
                const dob = new Date(year, month - 1, day);
                
                if (isNaN(dob.getTime())) return false;

                const retirementDate = new Date(dob);
                retirementDate.setFullYear(dob.getFullYear() + 60);
                return retirementDate >= today && retirementDate <= twelveMonthsFromNow;
            });
        
        if (debouncedSearchTerm) {
            const lowercasedTerm = debouncedSearchTerm.toLowerCase();
            retiringStaff = retiringStaff.filter(member =>
                member.name.toLowerCase().includes(lowercasedTerm) ||
                member.staff_id.toLowerCase().includes(lowercasedTerm)
            );
        }

        return retiringStaff.sort((a, b) => {
                const [yearA, monthA, dayA] = a.dob!.split('-').map(Number);
                const retirementDateA = new Date(yearA + 60, monthA - 1, dayA);
                
                const [yearB, monthB, dayB] = b.dob!.split('-').map(Number);
                const retirementDateB = new Date(yearB + 60, monthB - 1, dayB);

                return retirementDateA.getTime() - retirementDateB.getTime();
            });
    }, [allStaff, debouncedSearchTerm]);

    const demographicsData = useMemo(() => {
        if (allStaff.length === 0) return null;
        const ageGroups = { '<30': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0, 'Unknown': 0 };
        const serviceGroups = { '0-5': 0, '6-10': 0, '11-20': 0, '21+': 0, 'Unknown': 0 };
        
        allStaff.forEach(member => {
            const age = calculateAge(member.dob);
            if (age === null) ageGroups.Unknown++;
            else if (age < 30) ageGroups['<30']++;
            else if (age <= 39) ageGroups['30-39']++;
            else if (age <= 49) ageGroups['40-49']++;
            else if (age <= 59) ageGroups['50-59']++;
            else ageGroups['60+']++;

            const service = calculateServiceYears(member.date_first_app);
            if (service === null) serviceGroups.Unknown++;
            else if (service <= 5) serviceGroups['0-5']++;
            else if (service <= 10) serviceGroups['6-10']++;
            else if (service <= 20) serviceGroups['11-20']++;
            else serviceGroups['21+']++;
        });

        const rankDistribution = countItems(allStaff, 'rank');

        return { ageGroups, serviceGroups, rankDistribution };
    }, [allStaff]);

    const qualificationsData = useMemo(() => {
        if (allStaff.length === 0) return null;
        return {
            academic: countItems(allStaff, 'acad_qual'),
            professional: countItems(allStaff, 'prof_qual'),
            subjects: countItems(allStaff, 'subject'),
        };
    }, [allStaff]);

    const attritionData = useMemo(() => {
        if (allStaff.length === 0) return null;
        return {
            transferred: allStaff.filter(s => s.status === 'TRANSFERRED').length,
            vacated: allStaff.filter(s => s.status === 'VACATED POST').length,
        };
    }, [allStaff]);
    
    const dataAuditData = useMemo(() => {
        if (allStaff.length === 0) return null;
        let auditedStaff = allStaff
            .map(member => {
                const missing = [];
                if (!member.bank_name || !member.account) missing.push('Bank Details');
                if (!member.ssnit) missing.push('SSNIT');
                if (!member.gh_card) missing.push('Ghana Card');
                if (!member.dob) missing.push('Date of Birth');
                return { ...member, missing };
            })
            .filter(member => member.missing.length > 0);
        
        if (debouncedSearchTerm) {
            const lowercasedTerm = debouncedSearchTerm.toLowerCase();
            auditedStaff = auditedStaff.filter(member =>
                member.name.toLowerCase().includes(lowercasedTerm) ||
                member.staff_id.toLowerCase().includes(lowercasedTerm)
            );
        }

        return auditedStaff;
    }, [allStaff, debouncedSearchTerm]);
    
    const nominalRollData = useMemo(() => {
        if (allStaff.length === 0) return null;

        let staffToProcess = allStaff;
        if (debouncedSearchTerm) {
            const lowercasedTerm = debouncedSearchTerm.toLowerCase();
            staffToProcess = allStaff.filter(member =>
                member.name.toLowerCase().includes(lowercasedTerm) ||
                member.staff_id.toLowerCase().includes(lowercasedTerm)
            );
        }

        const approvalsMap = new Map(allApprovals.map(a => [a.staff_member_id, a.status]));
        return staffToProcess.map(staff => ({
            ...staff,
            approval_status: approvalsMap.get(staff.id) || 'Pending'
        }));
    }, [allStaff, allApprovals, debouncedSearchTerm]);

    const handleGenerateReport = async (reportType: ReportType) => {
        if (!user) return;
        setSearchTerm(''); // Reset search on new report generation
        await fetchAllStaffData();
        
        if (reportType === 'nominal-roll') {
            setLoading(true);
            setError('');
            try {
                const [year, month] = nominalRollDate.split('-').map(Number);
                const monthStartDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
                const approvalsData = user.role === UserRole.Superadmin
                    ? await api.getAllMonthlyApprovals(monthStartDate)
                    : await api.getMonthlyApprovals(user.emiscode, monthStartDate);
                setAllApprovals(approvalsData);
            } catch (err: any) {
                setError(err.message || "Failed to fetch nominal roll approvals.");
            } finally {
                setLoading(false);
            }
        }
        setActiveReport(reportType);
    };

    const universalExport = (format: 'csv' | 'print') => {
        let headers: string[] = [];
        let dataRows: (string | number | undefined | null)[][] = [];
        let title = 'Report';
        let reportDate = new Date().toLocaleDateString();

        switch(activeReport) {
            case 'metropolis-summary':
                title = 'Metropolis Staff Summary';
                headers = ['School', 'Total', 'At Post', 'On Leave', 'Transferred', 'Vacated'];
                dataRows = metropolisSummary?.map(([school, stats]) => [school, stats.total, stats.atPost, stats.onLeave, stats.transferred, stats.vacated]) || [];
                break;
            case 'retirement-forecast':
                title = 'Retirement Forecast';
                headers = ['Name', 'School', 'Retirement Date'];
                dataRows = retirementForecast?.map(s => {
                    const retirementDate = new Date(s.dob!);
                    retirementDate.setFullYear(retirementDate.getFullYear() + 60);
                    return [s.name, s.school, retirementDate.toLocaleDateString('en-GB')];
                }) || [];
                break;
            case 'nominal-roll':
                const selectedDate = new Date(nominalRollDate + '-02');
                title = `Monthly Nominal Roll - ${selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
                if(nominalRollData && nominalRollData.length > 0) {
                    headers = [...Object.keys(nominalRollData[0])];
                    dataRows = nominalRollData.map(row => headers.map(header => (row as any)[header]));
                }
                break;
            case 'full-export':
                 title = `Full Staff Export - ${reportDate}`;
                 if(allStaff.length > 0) {
                    headers = [...Object.keys(allStaff[0])];
                    dataRows = allStaff.map(row => headers.map(header => (row as any)[header]));
                 }
                 break;
            case 'data-audit':
                title = 'Data Completeness Audit';
                headers = ['Name', 'Staff ID', 'School', 'Missing Fields'];
                dataRows = dataAuditData?.map(s => [s.name, s.staff_id, s.school, s.missing.join(', ')]) || [];
                break;
            // Non-tabular reports need special handling
            default:
                alert("Export/Print is only available for tabular reports.");
                return;
        }

        if (format === 'csv') {
            const csvRows = [headers.join(',')];
            dataRows.forEach(row => {
                const values = row.map(val => `"${String(val || '').replace(/"/g, '""')}"`);
                csvRows.push(values.join(','));
            });
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', `${title.replace(/ /g, '_')}.csv`);
            link.click();
        } else { // print
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                const tableHeaders = headers.map(h => `<th>${h.replace(/_/g, ' ')}</th>`).join('');
                const tableBody = dataRows.map(row => `<tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`).join('');
                printWindow.document.write(`
                    <html>
                        <head><title>${title}</title>
                        <style>
                            body { font-family: sans-serif; } table { width: 100%; border-collapse: collapse; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
                            th { background-color: #f2f2f2; text-transform: capitalize; } h1 { color: #333; }
                        </style>
                        </head>
                        <body><h1>${title}</h1><p>Generated on: ${reportDate}</p><table><thead><tr>${tableHeaders}</tr></thead><tbody>${tableBody}</tbody></table></body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            }
        }
    };
    
// FIX: Refactored BarChart to resolve type errors in `reduce` and `sort` calls.
// The component now safely filters and sorts data, and derives the max value
// from the sorted data, making it more efficient and robust.
const BarChart: React.FC<{ data: Record<string, number>; title: string, color: string }> = ({ data, title, color }) => {
    // FIX: Ensure values from Object.entries are treated as numbers for sorting and calculations.
    // This also fixes the sort by using array indexing which avoids type inference issues with destructuring.
    const entries = (Object.entries(data)
        .filter(([, value]) => typeof value === 'number' && Number.isFinite(value)) as [string, number][])
        .sort((a, b) => b[1] - a[1]);

    // FIX: The original reduce on Object.values() had type issues.
    // Deriving maxValue from `entries` is safer, more efficient, and resolves the error.
    const maxValue = entries.length > 0 ? entries[0][1] : 0;
    
    if (entries.length === 0 || maxValue === 0) {
        return (
            <div className="my-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">{title}</h4>
                <p className="text-gray-500">No data available.</p>
            </div>
        );
    }

    return (
        <div className="my-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-2">{title}</h4>
            <div className="space-y-2">
                {entries.map(([key, value]) => (
                    <div key={key} className="flex items-center">
                        <span className="w-1/3 text-sm text-gray-600 truncate">{key}</span>
                        <div className="w-2/3 bg-gray-200 rounded-full h-4">
                            <div
                                className={`${color.replace('text-', 'bg-')} h-4 rounded-full flex items-center justify-end pr-2`}
                                style={{ width: `${(value / maxValue) * 100}%` }}
                            >
                                <span className="text-xs font-medium text-white">{value}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

    const ListTable: React.FC<{title: string; data: [string, number][]}> = ({title, data}) => {
        if (!data || data.length === 0) {
            return (
                <div className="my-6">
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">{title}</h4>
                    <p className="text-gray-500">No data available.</p>
                </div>
            );
        }
        return (
            <div className="my-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-2">{title}</h4>
                <div className="overflow-y-auto border rounded-lg max-h-80">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Item
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Count
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {[...data].sort((a, b) => {
                                const valA = a[1];
                                const valB = b[1];
                                if (typeof valA === 'number' && typeof valB === 'number') {
                                    return valB - valA;
                                }
                                return 0;
                            }).map(([key, value]) => (
                                <tr key={key}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const ReportActions: React.FC = () => {
        const isExportable = ['metropolis-summary', 'retirement-forecast', 'data-audit', 'nominal-roll', 'full-export'].includes(activeReport || '');
        const isFilterable = ['retirement-forecast', 'data-audit', 'nominal-roll'].includes(activeReport || '');

        if (!activeReport || loading) return null;

        return (
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                {isFilterable ? (
                    <div className="relative w-full sm:w-auto sm:max-w-xs flex-grow sm:flex-grow-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Filter by name or Staff ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 text-gray-900 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                ) : <div />} {/* Placeholder to keep alignment */}
                
                {isExportable && (
                     <div className="flex space-x-2">
                        <button
                            onClick={() => universalExport('print')}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <PrinterIcon className="h-4 w-4 mr-2" /> Print
                        </button>
                        <button
                            onClick={() => universalExport('csv')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                        >
                            <DocumentArrowDownIcon className="h-4 w-4 mr-2" /> Export CSV
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const ReportDisplay = () => {
        if (loading && !activeReport) {
            return (
                <div className="flex justify-center items-center py-16">
                    <div className="w-12 h-12 border-4 border-blue-600 border-dashed rounded-full animate-spin"></div>
                </div>
            );
        }
        if (error) {
            return <p className="text-center text-red-600 py-8">{error}</p>;
        }
        
        switch (activeReport) {
            case 'metropolis-summary':
                 return (
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Metropolis Staff Summary by School</h3>
                        <div className="overflow-x-auto max-h-[60vh]">
                            <table className="min-w-full bg-white">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">At Post</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">On Leave</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transferred</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vacated</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {metropolisSummary?.map(([school, stats]) => (
                                        <tr key={school}>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{school}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{stats.total}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{stats.atPost}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{stats.onLeave}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{stats.transferred}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{stats.vacated}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'retirement-forecast':
                return (
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Retirement Forecast (Next 12 Months)</h3>
                        {retirementForecast && retirementForecast.length > 0 ? (
                            <div className="overflow-x-auto max-h-[60vh]">
                                <table className="min-w-full bg-white">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retirement Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {retirementForecast.map(member => {
                                            const retirementDate = new Date(member.dob!);
                                            retirementDate.setFullYear(retirementDate.getFullYear() + 60);
                                            return (
                                                <tr key={member.id}>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{member.school}</td>
                                                    <td className="px-6 py-4 text-sm text-red-600 font-medium">{retirementDate.toLocaleDateString('en-GB')}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-center text-gray-500 py-8">{debouncedSearchTerm ? `No results found for "${debouncedSearchTerm}".` : 'No staff members are scheduled to retire in the next 12 months.'}</p>}
                    </div>
                );
            case 'nominal-roll':
                const headers = nominalRollData && nominalRollData.length > 0 ? Object.keys(nominalRollData[0]) : [];
                return (
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Nominal Roll</h3>
                        {nominalRollData && nominalRollData.length > 0 ? (
                            <div className="overflow-x-auto max-h-[60vh]">
                                <table className="min-w-full bg-white text-xs">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            {headers.map(h => <th key={h} className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h.replace(/_/g, ' ')}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {nominalRollData?.map(row => (
                                            <tr key={row.id}>
                                                {headers.map(header => <td key={`${row.id}-${header}`} className="px-4 py-2 whitespace-nowrap text-gray-700">{(row as any)[header]}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                {debouncedSearchTerm
                                    ? `No staff members found matching "${debouncedSearchTerm}".`
                                    : 'No data available for this report.'
                                }
                            </p>
                        )}
                    </div>
                );
            case 'full-export':
                return (
                    <div className="text-center py-8">
                        <h3 className="text-xl font-semibold text-gray-800">Full Staff Export</h3>
                        <p className="mt-2 text-gray-500">
                            {allStaff.length > 0 ? `Ready to export ${allStaff.length} staff records. Use the export buttons above.` : 'No staff data loaded.'}
                        </p>
                    </div>
                );
            case 'demographics':
                if (!demographicsData) return null;
                return (
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Staff Demographics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <BarChart data={demographicsData.ageGroups} title="Age Distribution" color="text-blue-500" />
                            <BarChart data={demographicsData.serviceGroups} title="Years of Service" color="text-green-500" />
                        </div>
                        <ListTable title="Rank Distribution" data={Object.entries(demographicsData.rankDistribution)} />
                    </div>
                );
            case 'qualifications':
                if (!qualificationsData) return null;
                return (
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Staff Qualifications</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                           <ListTable title="Academic Qualifications" data={Object.entries(qualificationsData.academic)} />
                           <ListTable title="Professional Qualifications" data={Object.entries(qualificationsData.professional)} />
                           <ListTable title="Subjects Taught" data={Object.entries(qualificationsData.subjects)} />
                        </div>
                    </div>
                );
            case 'attrition':
                if (!attritionData) return null;
                return (
                    <div className="text-center py-8">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Staff Attrition</h3>
                         <div className="flex justify-center gap-8">
                            <div className="p-6 bg-yellow-100 text-yellow-800 rounded-lg">
                                <p className="text-4xl font-bold">{attritionData.transferred}</p>
                                <p className="mt-1">Transferred</p>
                            </div>
                             <div className="p-6 bg-red-100 text-red-800 rounded-lg">
                                <p className="text-4xl font-bold">{attritionData.vacated}</p>
                                <p className="mt-1">Vacated Post</p>
                            </div>
                        </div>
                    </div>
                );
            case 'data-audit':
                 if (!dataAuditData) return null;
                 return (
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Data Completeness Audit</h3>
                        {dataAuditData && dataAuditData.length > 0 ? (
                            <div className="overflow-x-auto max-h-[60vh]">
                                <table className="min-w-full bg-white">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing Fields</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {dataAuditData.map(member => (
                                            <tr key={member.id}>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{member.staff_id}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{member.school}</td>
                                                <td className="px-6 py-4 text-sm text-red-600">{member.missing.join(', ')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-center text-gray-500 py-8">{debouncedSearchTerm ? `No results found for "${debouncedSearchTerm}".` : 'All staff records are complete.'}</p>}
                    </div>
                );
            default:
                return <p className="text-center text-gray-500 py-8">Select a report to generate.</p>;
        }
    };
    
    const ReportCard: React.FC<{title: string, description: string, icon: React.ReactNode, color: string, reportType: ReportType, children?: React.ReactNode}> = 
        ({ title, description, icon, color, reportType, children }) => (
            <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col">
                <div className={`h-10 w-10 mb-4 ${color}`}>{icon}</div>
                <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
                <p className="text-gray-500 mt-2 mb-4 flex-grow">{description}</p>
                {children}
                <button 
                    onClick={() => handleGenerateReport(reportType)} 
                    disabled={loading} 
                    className={`mt-auto w-full text-white ${color.replace('text-', 'bg-')} font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50`}
                >
                    {loading ? 'Loading...' : 'Generate'}
                </button>
            </div>
    );

    const isSuperadmin = user?.role === UserRole.Superadmin;

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">{isSuperadmin ? 'Metropolis Reports' : 'School Reports'}</h1>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={fetchAllStaffData}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isSuperadmin && <ReportCard title="Metropolis Summary" description="Staff statistics for every school." icon={<BuildingOffice2Icon className="h-10 w-10" />} color="text-blue-500" reportType="metropolis-summary" />}
                <ReportCard title="Retirement Forecast" description="Staff retiring in the next 12 months." icon={<CakeIcon className="h-10 w-10" />} color="text-yellow-500" reportType="retirement-forecast" />
                <ReportCard title="Staff Demographics" description="Breakdown by age, rank, and service years." icon={<UsersIcon className="h-10 w-10" />} color="text-purple-500" reportType="demographics" />
                <ReportCard title="Data Audit" description="Find staff with incomplete records." icon={<ClipboardDocumentCheckIcon className="h-10 w-10" />} color="text-teal-500" reportType="data-audit" />
                 <ReportCard title="Monthly Nominal Roll" description="Generate the full nominal roll for a selected month." icon={<TableCellsIcon className="h-10 w-10" />} color="text-pink-500" reportType="nominal-roll">
                     <div className="mb-4">
                        <label htmlFor="nominal-roll-date" className="block text-sm font-medium text-gray-700">Report Month</label>
                        <input
                            type="month"
                            id="nominal-roll-date"
                            value={nominalRollDate}
                            onChange={(e) => setNominalRollDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                     </div>
                 </ReportCard>
                <ReportCard title="Full Staff Export" description="Download a CSV of all staff records." icon={<DocumentArrowDownIcon className="h-10 w-10" />} color="text-green-500" reportType="full-export" />
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg min-h-[24rem]">
                <ReportActions />
                <ReportDisplay />
            </div>
        </div>
    );
};

export default Reports;