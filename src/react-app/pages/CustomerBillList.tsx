import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Download, Eye, Loader2, Package } from 'lucide-react';
import { CompanyDetails, InvoiceData } from '../types';
import { downloadSingleInvoicePDF, downloadBatchInvoicesAsZip } from '../services/BackgroundPDFGenerator';

interface Invoice {
    id: string;
    invoiceNumber: string;
    customerId: string;
    date: string;
    time?: string;
    amount: number;
    paidAmount: number;
    balance: number;
    paymentMode: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    dueDate?: string;
    products?: any[];
}

interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string;
    email: string;
    gstin?: string;
}

/**
 * CustomerBillList Component
 * 
 * Displays all bills for a specific customer in a list/table format.
 * Provides individual download buttons for each bill and a "Download All" option.
 * 
 * Route: /customers/:customerId/bills
 */
export default function CustomerBillList() {
    const { customerId } = useParams<{ customerId: string }>();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadingAll, setDownloadingAll] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);

    // Company details
    const companyDetails: CompanyDetails = {
        name: 'VK INFO TECH',
        tagline: 'Complete Technology Solution Provider',
        address: '123 Tech Street, Digital City',
        mobile: '+91 9876543210',
        email: 'vkinfotech.vk@gmail.com',
        gstin: '33AAAAA0000A1Z5',
        bankName: 'HDFC Bank',
        accountNumber: '1234567890',
        ifsc: 'HDFC0001234',
        upiId: 'vkinfotech@upi',
        logo: '/invoice-logo.png',
        qrCode: '/payment-qr.png',
        bankHolder: 'Vasanthakumar Palanivel'
    };

    useEffect(() => {
        loadCustomerBills();
    }, [customerId]);

    const loadCustomerBills = () => {
        try {
            setLoading(true);
            setError(null);

            // Load from localStorage
            const customers = JSON.parse(localStorage.getItem('customers') || '[]');
            const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');

            // Find customer
            const foundCustomer = customers.find((c: Customer) => c.id === customerId);
            if (!foundCustomer) {
                setError('Customer not found');
                setLoading(false);
                return;
            }

            // Find all invoices for this customer
            const customerInvoices = allInvoices.filter((inv: Invoice) =>
                inv.customerId === customerId ||
                (inv.customerPhone && inv.customerPhone === foundCustomer.phone) ||
                (!inv.customerId && inv.customerName === foundCustomer.name)
            );

            // Sort by date (most recent first)
            customerInvoices.sort((a: Invoice, b: Invoice) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setCustomer(foundCustomer);
            setInvoices(customerInvoices);
            setLoading(false);
        } catch (err) {
            console.error('Error loading bills:', err);
            setError('Failed to load bills');
            setLoading(false);
        }
    };

    const mapInvoiceToData = (invoice: Invoice): InvoiceData => {
        const numberToWords = (num: number): string => {
            const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
            const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

            if ((num = num.toString().length > 9 ? parseFloat(num.toString().substring(0, 9)) : num) === 0) return 'zero';
            const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return '';
            let str = '';
            str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'crore ' : '';
            str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'lakh ' : '';
            str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'thousand ' : '';
            str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'hundred ' : '';
            str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
            return str.trim();
        };

        return {
            invoiceNumber: invoice.invoiceNumber,
            date: invoice.date,
            time: invoice.time || '10:00 AM',
            dueDate: invoice.dueDate || '-',
            paymentMode: invoice.paymentMode,
            customerName: customer?.name || invoice.customerName || '',
            customerPhone: customer?.phone || invoice.customerPhone || '',
            customerAddress: customer?.address || invoice.customerAddress || '',
            products: (invoice.products || []).map((p: any, index: number) => ({
                sNo: index + 1,
                description: p.name || p.description,
                qty: p.quantity || p.qty,
                rate: p.price || p.rate,
                discountPercent: p.discount || p.discountPercent || 0,
                amount: p.amount
            })),
            subTotal: invoice.amount,
            gstRate: 0,
            totalGst: 0,
            sgst: 0,
            cgst: 0,
            roundOff: 0,
            grandTotal: invoice.amount,
            paidAmount: invoice.paidAmount,
            balance: invoice.balance,
            amountInWords: numberToWords(Math.round(invoice.amount))
        };
    };

    const handleViewBill = (billId: string) => {
        navigate(`/customers/${customerId}/bill/${billId}`);
    };

    const handleDownloadBill = async (invoice: Invoice) => {
        if (!customer) return;

        setDownloadingId(invoice.id);
        try {
            const invoiceData = mapInvoiceToData(invoice);
            await downloadSingleInvoicePDF(companyDetails, invoiceData);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download PDF. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDownloadAll = async () => {
        if (!customer || invoices.length === 0) return;

        setDownloadingAll(true);
        setBatchProgress({ current: 0, total: invoices.length });

        try {
            const allInvoiceData = invoices.map(inv => mapInvoiceToData(inv));

            await downloadBatchInvoicesAsZip(
                companyDetails,
                allInvoiceData,
                customer.name,
                {
                    onProgress: (current, total) => {
                        setBatchProgress({ current, total });
                    }
                }
            );
        } catch (err) {
            console.error('Batch download failed:', err);
            alert('Failed to download all bills. Please try again.');
        } finally {
            setDownloadingAll(false);
            setBatchProgress({ current: 0, total: 0 });
        }
    };

    const handleBack = () => {
        navigate('/customers');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Loading bills...</p>
                </div>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg mb-4">
                        <p className="font-semibold">{error || 'Customer not found'}</p>
                    </div>
                    <button
                        onClick={handleBack}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Back to Customers
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={20} />
                                <span className="font-medium">Back to Customers</span>
                            </button>
                            <div className="h-6 w-px bg-gray-300" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">{customer.name}'s Bills</h1>
                                <p className="text-sm text-gray-500">{customer.phone} • {invoices.length} {invoices.length === 1 ? 'bill' : 'bills'}</p>
                            </div>
                        </div>

                        {invoices.length > 0 && (
                            <button
                                onClick={handleDownloadAll}
                                disabled={downloadingAll}
                                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                            >
                                {downloadingAll ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Downloading {batchProgress.current}/{batchProgress.total}...</span>
                                    </>
                                ) : (
                                    <>
                                        <Package size={18} />
                                        <span>Download All Bills</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bill List */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {invoices.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Bills Found</h3>
                        <p className="text-gray-500">This customer doesn't have any bills yet.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Invoice #
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Paid
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-semibold text-gray-800">{invoice.invoiceNumber}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                {new Date(invoice.date).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-semibold text-gray-800">₹{invoice.amount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-green-600 font-medium">₹{invoice.paidAmount.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {invoice.balance > 0 ? (
                                                    <span className="text-red-600 font-medium">₹{invoice.balance.toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${invoice.paymentMode === 'Cash' ? 'bg-green-100 text-green-700' :
                                                        invoice.paymentMode === 'UPI' ? 'bg-blue-100 text-blue-700' :
                                                            invoice.paymentMode === 'Card' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {invoice.paymentMode}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleViewBill(invoice.id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Bill"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadBill(invoice)}
                                                        disabled={downloadingId === invoice.id}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Download PDF"
                                                    >
                                                        {downloadingId === invoice.id ? (
                                                            <Loader2 size={18} className="animate-spin" />
                                                        ) : (
                                                            <Download size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
