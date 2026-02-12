import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Download, Printer, Loader2 } from 'lucide-react';
import InvoiceTemplate from '../components/invoice/InvoiceTemplate';
import { CompanyDetails, InvoiceData } from '../types';
import { downloadSingleInvoicePDF } from '../services/BackgroundPDFGenerator';

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
 * InvoiceView Component
 * 
 * Full-page read-only invoice viewer for customer bill history.
 * This component is ONLY for viewing historical bills.
 * 
 * DO NOT use this for creating or editing bills - use Billing page instead.
 * 
 * Route: /customers/:customerId/bill/:billId
 */
export default function InvoiceView() {
    const { customerId, billId } = useParams<{ customerId: string; billId: string }>();
    const navigate = useNavigate();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Company details (should match Billing page)
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
        loadInvoiceData();
    }, [customerId, billId]);

    const loadInvoiceData = () => {
        try {
            setLoading(true);
            setError(null);

            // Load from localStorage
            const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            const customers = JSON.parse(localStorage.getItem('customers') || '[]');

            // Find the specific invoice
            const foundInvoice = invoices.find((inv: Invoice) =>
                inv.id === billId || inv.invoiceNumber === billId
            );

            if (!foundInvoice) {
                setError('Invoice not found');
                setLoading(false);
                return;
            }

            // Find the customer
            const foundCustomer = customers.find((cust: Customer) =>
                cust.id === customerId || cust.id === foundInvoice.customerId
            );

            if (!foundCustomer) {
                setError('Customer not found');
                setLoading(false);
                return;
            }

            setInvoice(foundInvoice);
            setCustomer(foundCustomer);
            setLoading(false);
        } catch (err) {
            console.error('Error loading invoice:', err);
            setError('Failed to load invoice data');
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!invoice || !customer) return;

        setDownloading(true);
        try {
            const invoiceData = mapInvoiceToData(invoice, customer);
            await downloadSingleInvoicePDF(companyDetails, invoiceData);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        navigate('/customers');
    };

    const mapInvoiceToData = (inv: Invoice, cust: Customer): InvoiceData => {
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
            invoiceNumber: inv.invoiceNumber,
            date: inv.date,
            time: inv.time || '10:00 AM',
            dueDate: inv.dueDate || '-',
            paymentMode: inv.paymentMode,
            customerName: cust.name,
            customerPhone: cust.phone,
            customerAddress: cust.address,
            products: (inv.products || []).map((p: any, index: number) => ({
                sNo: index + 1,
                description: p.name || p.description,
                qty: p.quantity || p.qty,
                rate: p.price || p.rate,
                discountPercent: p.discount || p.discountPercent || 0,
                amount: p.amount
            })),
            subTotal: inv.amount,
            gstRate: 0,
            totalGst: 0,
            sgst: 0,
            cgst: 0,
            roundOff: 0,
            grandTotal: inv.amount,
            paidAmount: inv.paidAmount,
            balance: inv.balance,
            amountInWords: numberToWords(Math.round(inv.amount))
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (error || !invoice || !customer) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg mb-4">
                        <p className="font-semibold">{error || 'Invoice not found'}</p>
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

    const invoiceData = mapInvoiceToData(invoice, customer);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header - Hidden on print */}
            <div className="bg-white border-b border-gray-200 shadow-sm print:hidden sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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
                            <h1 className="text-xl font-bold text-gray-800">Invoice #{invoice.invoiceNumber}</h1>
                            <p className="text-sm text-gray-500">{customer.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <Printer size={18} />
                            <span>Print</span>
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {downloading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Downloading...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    <span>Download PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Display */}
            <div className="max-w-7xl mx-auto px-4 py-8 print:p-0">
                <div id="invoice" className="print:shadow-none">
                    <InvoiceTemplate company={companyDetails} data={invoiceData} />
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
        </div>
    );
}
