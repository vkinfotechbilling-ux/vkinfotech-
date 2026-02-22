import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { Download } from 'lucide-react';
import { reportService } from '../../services/ReportService';
import { useEffect, useState } from 'react';

export default function SalesReports() {
    const [salesData, setSalesData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await reportService.getSalesReport({});
            setSalesData(data);
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Sales Trend */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Daily Sales Trend</h3>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-800">
                            <Download size={18} />
                        </button>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#1f2937' }}
                                />
                                <Line type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Comparison (Mocked for now as we might not have months of data) */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Payment Mode Analysis</h3>
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                        {/* Placeholder for Pie Chart or Bar Chart Breakdown */}
                        <p>Insufficient data for monthly comparison</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
