import { reportService } from '../../services/ReportService';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function FinancialReports() {
    const [financials, setFinancials] = useState<any>({ totalGST: 0, netRevenue: 0 });

    useEffect(() => {
        setFinancials(reportService.getFinancialSummary());
    }, []);

    const pieData = [
        { name: 'Net Revenue', value: financials.netRevenue, color: '#22c55e' },
        { name: 'GST Collected', value: financials.totalGST, color: '#f87171' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenue Breakdown */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Breakdown</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => `₹${(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#1f2937' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tax Summary Table */}
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Tax Summary (GST)</h3>
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
                            <span className="text-gray-600">Total GST Collected</span>
                            <span className="text-red-500 font-bold text-xl">₹{financials.totalGST.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-gray-500 text-sm mb-1">CGST (9%)</p>
                                <p className="text-gray-800 font-bold">₹{(financials.totalGST / 2).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-gray-500 text-sm mb-1">SGST (9%)</p>
                                <p className="text-gray-800 font-bold">₹{(financials.totalGST / 2).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-600 text-sm">
                                * Tax calculations are estimates based entirely on 18% GST slab for all products.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
