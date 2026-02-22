import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { reportService } from '../../services/ReportService';
import { useEffect, useState } from 'react';

export default function ProductReports() {
    const [topProducts, setTopProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await reportService.getTopSellingProducts();
            setTopProducts(data);
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Top Selling Products</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                                <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" width={100} stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#1f2937' }}
                                />
                                <Bar dataKey="quantity" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Product Performance Details</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-200">
                                    <th className="pb-3 px-2">Product Name</th>
                                    <th className="pb-3 px-2 text-right">Qty Sold</th>
                                    <th className="pb-3 px-2 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((p, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-2 text-gray-800 font-medium">{p.name}</td>
                                        <td className="py-3 px-2 text-right text-blue-600 font-medium">{p.quantity}</td>
                                        <td className="py-3 px-2 text-right text-green-600 font-medium">--</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
