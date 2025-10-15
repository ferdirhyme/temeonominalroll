
import React from 'react';

interface DashboardCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between transform hover:scale-105 transition-transform duration-300">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
            </div>
            <div className={`p-4 rounded-full ${color}`}>
                {icon}
            </div>
        </div>
    );
};

export default DashboardCard;
