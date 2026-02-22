import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import ReportSummary from '../components/reports/ReportSummary';
import SalesReports from '../components/reports/SalesReports';
import ProductReports from '../components/reports/ProductReports';
import StockReports from '../components/reports/StockReports';
import CustomerReports from '../components/reports/CustomerReports';
import FinancialReports from '../components/reports/FinancialReports';
import { reportService, type ReportSummary as SummaryType } from '../services/ReportService';

export default function Reports() {
    const [activeTab, setActiveTab] = useState('sales');
    const [summaryData, setSummaryData] = useState<SummaryType>({
        totalSales: 0,
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        profit: 0,
        stockValue: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            const data = await reportService.getSummaryMetrics();
            setSummaryData(data);
        };
        fetchData();
    }, []);

    const tabs = [
        { id: 'sales', label: 'Sales Reports' },
        { id: 'product', label: 'Product Reports' },
        { id: 'stock', label: 'Stock Reports' },
        { id: 'customer', label: 'Customer Reports' },
        { id: 'financial', label: 'Financial Reports' },
    ];



    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics & Reports</h1>
                    <p className="text-gray-500">Comprehensive business intelligence overview</p>
                </div>
                <div></div>
            </div>

            {/* Summary Cards */}
            <ReportSummary data={summaryData} />

            {/* Main Content Area */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl">
                {/* Tabs & Filter Bar */}
                <div className="border-b border-gray-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50">
                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Filter Toggle (Placeholder) */}
                    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                        <Filter size={16} />
                        <span>Filters</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6 min-h-[500px] bg-white">
                    {activeTab === 'sales' && <SalesReports />}
                    {activeTab === 'product' && <ProductReports />}
                    {activeTab === 'stock' && <StockReports />}
                    {activeTab === 'customer' && <CustomerReports />}
                    {activeTab === 'financial' && <FinancialReports />}
                </div>
            </div>
        </div>
    );
}
