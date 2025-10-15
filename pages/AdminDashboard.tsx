import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/supabaseApi';
import { StaffMember, StaffStatus } from '../types';
import DashboardCard from '../components/DashboardCard';
import ExportOptionsModal from '../components/ExportOptionsModal'; // New component import
import { UsersIcon, UserMinusIcon, ClockIcon, ArrowDownTrayIcon, ChartPieIcon, ChartBarIcon } from '@heroicons/react/24/solid';
// FIX: Use named import for react-router-dom to resolve module export errors.
import { Link, useNavigate } from 'react-router-dom';
import { getStandardizedRank } from '../utils/ranks';

// --- NEW REFACTORED CHART COMPONENTS ---

const DonutChartContent: React.FC<{ 
    data: { [key: string]: number };
    onSegmentClick: (key: string) => void;
    hoveredSegment: string | null;
    setHoveredSegment: (key: string | null) => void;
}> = ({ data, onSegmentClick, hoveredSegment, setHoveredSegment }) => {
    const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#6b7280'];
    // FIX: Ensure values from Object.entries are treated as numbers for calculations.
    const entries = (Object.entries(data).filter(([, value]) => typeof value === 'number' && value > 0) as [string, number][]);
    const total = entries.reduce((acc, [, value]) => acc + value, 0);
    if (total === 0) return <div className="text-center text-gray-500">No data available</div>;

    let cumulative = 0;
    const circumference = 2 * Math.PI * 15.915; // 2 * PI * r

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
            <div className="relative w-40 h-40 cursor-pointer flex-shrink-0">
                <svg viewBox="0 0 36 36" className="transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" className="stroke-current text-gray-200" strokeWidth="3" fill="transparent" />
                    {entries.map(([key, value], index) => {
                        const percentage = (value / total) * 100;
                        const offset = (cumulative / 100) * circumference;
                        cumulative += percentage;
                        return (
                            <circle
                                key={key}
                                cx="18"
                                cy="18"
                                r="15.915"
                                stroke={colors[index % colors.length]}
                                strokeWidth="3.5"
                                fill="transparent"
                                strokeDasharray={`${circumference}`}
                                strokeDashoffset={circumference - offset}
                                onClick={() => onSegmentClick(key)}
                                onMouseEnter={() => setHoveredSegment(key)}
                                onMouseLeave={() => setHoveredSegment(null)}
                                style={{
                                    transition: 'all 0.2s ease-in-out',
                                    opacity: hoveredSegment && hoveredSegment !== key ? 0.3 : 1,
                                    transformOrigin: 'center',
                                    transform: hoveredSegment === key ? 'scale(1.05)' : 'scale(1)',
                                }}
                            />
                        );
                    })}
                </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-800">{total}</span>
                    <span className="text-sm text-gray-500">Total</span>
                </div>
            </div>
            <div className="w-full md:w-auto">
                <ul className="space-y-2">
                    {entries.map(([key, value], index) => (
                         <li 
                            key={key} 
                            className="flex items-center cursor-pointer p-1 rounded-md"
                            onClick={() => onSegmentClick(key)}
                            onMouseEnter={() => setHoveredSegment(key)}
                            onMouseLeave={() => setHoveredSegment(null)}
                            style={{
                                transition: 'all 0.2s ease-in-out',
                                opacity: hoveredSegment && hoveredSegment !== key ? 0.5 : 1,
                                backgroundColor: hoveredSegment === key ? '#f3f4f6' : 'transparent'
                            }}
                        >
                            <span className="h-3 w-3 rounded-full mr-3" style={{ backgroundColor: colors[index % colors.length] }}></span>
                            <span className="text-gray-700">{key}:</span>
                            <span className="font-semibold ml-auto pl-4">{value}</span>
                            <span className="text-sm text-gray-500 w-12 text-right">({(value / total * 100).toFixed(0)}%)</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const BarChartContent: React.FC<{ 
    data: { [key: string]: number };
    onSegmentClick?: (key: string) => void;
    hoveredSegment?: string | null;
    setHoveredSegment?: (key: string | null) => void;
    useColorPalette?: boolean;
}> = ({ data, onSegmentClick, hoveredSegment, setHoveredSegment, useColorPalette = false }) => {
    // FIX: Ensure values from Object.entries are treated as numbers for calculations and sorting.
    const entries = (Object.entries(data).filter(([, value]) => typeof value === 'number' && value > 0) as [string, number][]).sort((a, b) => b[1] - a[1]);
    const maxValue = Math.max(...entries.map(([, value]) => value));
    if (entries.length === 0) return <div className="text-center text-gray-500">No data available</div>;
    const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#6b7280'];

    return (
        <div className="space-y-4 w-full">
            {entries.map(([label, value], index) => (
                <div 
                    key={label} 
                    className="grid grid-cols-3 items-center gap-2 group"
                    onClick={() => onSegmentClick && onSegmentClick(label)}
                    onMouseEnter={() => setHoveredSegment && setHoveredSegment(label)}
                    onMouseLeave={() => setHoveredSegment && setHoveredSegment(null)}
                    style={{
                        cursor: onSegmentClick ? 'pointer' : 'default',
                        transition: 'opacity 0.2s ease-in-out',
                        opacity: hoveredSegment && hoveredSegment !== label ? 0.5 : 1,
                    }}
                >
                    <div className="text-sm text-gray-600 truncate col-span-1 group-hover:text-blue-600">{label || 'N/A'}</div>
                    <div className="col-span-2 bg-gray-200 rounded-full h-5">
                        <div
                            className="h-5 rounded-full flex items-center justify-end pr-2"
                            style={{ 
                                width: `${(value / maxValue) * 100}%`,
                                backgroundColor: useColorPalette ? colors[index % colors.length] : '#3b82f6',
                                transition: 'width 0.3s ease-in-out',
                            }}
                        >
                            <span className="text-xs font-medium text-white">{value}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};


// Gets the start of the current month in 'YYYY-MM-01' format
const getCurrentMonthStartDate = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [pendingStaff, setPendingStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
    const [statusChartType, setStatusChartType] = useState<'donut' | 'bar'>('donut');
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        if (user) {
            setLoading(true);
            setError('');
            try {
                const currentMonth = getCurrentMonthStartDate();
                const [allStaffData, approvalsData] = await Promise.all([
                    api.getStaffByEmiscode(user.emiscode),
                    api.getMonthlyApprovals(user.emiscode, currentMonth)
                ]);

                setStaff(allStaffData);

                const approvedStaffIds = new Set(approvalsData.map(a => a.staff_member_id));
                const staffAwaitingApproval = allStaffData.filter(s => !approvedStaffIds.has(s.id));
                setPendingStaff(staffAwaitingApproval);

            } catch (err) {
                setError('Failed to fetch dashboard data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    // Updated function to accept selected columns
    const handleExportCSV = (selectedColumns: (keyof StaffMember)[], columnMap: Record<keyof StaffMember, string>) => {
        setIsExportModalOpen(false);
        const headers = selectedColumns.map(col => columnMap[col]);
        
        const csvRows = [headers.join(',')];

        staff.forEach(member => {
            const values = selectedColumns.map(col => {
                const value = member[col];
                 // Escape quotes and wrap all values in quotes to handle commas within fields
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
        link.setAttribute('download', `staff_list_${user?.emiscode}_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Updated function to accept selected columns
    const handlePrint = (selectedColumns: (keyof StaffMember)[], columnMap: Record<keyof StaffMember, string>) => {
        setIsExportModalOpen(false);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const headers = selectedColumns.map(col => `<th>${columnMap[col]}</th>`).join('');
            
            let tableRows = '';
            staff.forEach(member => {
                const cells = selectedColumns.map(col => `<td>${member[col] || 'N/A'}</td>`).join('');
                tableRows += `<tr>${cells}</tr>`;
            });
            
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Staff List - ${user?.name}</title>
                        <style>
                            body { font-family: sans-serif; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
                            th { background-color: #f2f2f2; }
                            h1 { color: #333; }
                             @media print {
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Staff List for ${staff.length > 0 ? staff[0].school : 'Your School'}</h1>
                        <p>Total Staff: ${staff.length}</p>
                        <table>
                            <thead>
                                <tr>
                                    ${headers}
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    const handleSegmentClick = (status: string) => {
        if (status === 'Unknown') return; // Don't navigate for unknown status
        navigate(`/approved-staff?status=${encodeURIComponent(status)}`);
    };

    const stats = useMemo(() => {
        const statusCounts = staff.reduce((acc, s) => {
            const status = (s.status || 'Unknown').trim().toUpperCase();
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: staff.length,
            active: statusCounts[StaffStatus.AtPost] || 0,
            onLeave: statusCounts[StaffStatus.OnLeave] || 0,
            vacated: statusCounts[StaffStatus.VacatedPost] || 0,
        };
    }, [staff]);
    
    const statusChartData = useMemo(() => {
        return staff.reduce((acc, member) => {
            const status = (member.status || 'Unknown').trim();
             // Ensure we use the exact enum values for keys if they match
            const statusKey = Object.values(StaffStatus).find(s => s.toLowerCase() === status.toLowerCase()) || status;
            acc[statusKey] = (acc[statusKey] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [staff]);

    const rankDistribution = useMemo(() => {
        return staff.reduce((acc, member) => {
            const rank = getStandardizedRank(member.rank);
            acc[rank] = (acc[rank] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
    }, [staff]);

    const recentPendingStaff = useMemo(() => {
        return pendingStaff.slice(0, 5);
    }, [pendingStaff]);

    if (loading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }
    
    if (error) {
         return <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>;
    }

    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name}!</h1>
                    <button 
                        onClick={() => setIsExportModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        Export Staff List
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardCard title="Total Staff" value={stats.total} icon={<UsersIcon className="h-8 w-8 text-white"/>} color="bg-blue-500" />
                    <DashboardCard title="Active Staff" value={stats.active} icon={<UsersIcon className="h-8 w-8 text-white"/>} color="bg-green-500" />
                    <DashboardCard title="On Leave" value={stats.onLeave} icon={<ClockIcon className="h-8 w-8 text-white"/>} color="bg-yellow-500" />
                    <DashboardCard title="Vacated Post" value={stats.vacated} icon={<UserMinusIcon className="h-8 w-8 text-white"/>} color="bg-red-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-700">Staff Status Distribution</h2>
                            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                                <button
                                    title="Donut Chart"
                                    onClick={() => setStatusChartType('donut')}
                                    className={`p-1.5 rounded-md transition-all ${statusChartType === 'donut' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-200'}`}
                                    aria-pressed={statusChartType === 'donut'}
                                >
                                    <ChartPieIcon className="h-5 w-5" />
                                </button>
                                <button
                                    title="Bar Chart"
                                    onClick={() => setStatusChartType('bar')}
                                    className={`p-1.5 rounded-md transition-all ${statusChartType === 'bar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-200'}`}
                                    aria-pressed={statusChartType === 'bar'}
                                >
                                    <ChartBarIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-grow flex items-center justify-center">
                            {statusChartType === 'donut' ? (
                                <DonutChartContent
                                    data={statusChartData}
                                    onSegmentClick={handleSegmentClick}
                                    hoveredSegment={hoveredSegment}
                                    setHoveredSegment={setHoveredSegment}
                                />
                            ) : (
                                <BarChartContent
                                    data={statusChartData}
                                    onSegmentClick={handleSegmentClick}
                                    hoveredSegment={hoveredSegment}
                                    setHoveredSegment={setHoveredSegment}
                                    useColorPalette={true}
                                />
                            )}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg h-full flex flex-col">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Staff by Rank</h2>
                        <div className="flex-grow">
                             <BarChartContent data={rankDistribution} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-700">Pending Approvals for Current Month</h2>
                        <Link to="/pending-approval" className="text-sm font-medium text-blue-600 hover:underline">View All ({pendingStaff.length})</Link>
                    </div>
                    {recentPendingStaff.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {recentPendingStaff.map(member => (
                                <li key={member.id} className="py-3 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-800">{member.name}</p>
                                        <p className="text-sm text-gray-500">{member.staff_id} - {member.rank || 'N/A'}</p>
                                    </div>
                                    <span className="px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">
                                        Pending
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-4">All staff have been actioned for this month.</p>
                    )}
                </div>
            </div>
            <ExportOptionsModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExportCSV={handleExportCSV}
                onExportPrint={handlePrint}
            />
        </>
    );
};

export default AdminDashboard;