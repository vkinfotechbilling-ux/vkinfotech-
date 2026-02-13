import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,


  Edit,
  Trash2,
  Users,
  TrendingUp,
  UserCheck,
  UserPlus,
  X,
  ShoppingBag,
  DollarSign,
  Calendar,
  CheckCircle,
  Check,
  FileSpreadsheet,
  BarChart3,
  Clock,
  Download,
  Layers,
  Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CompanyDetails, InvoiceData } from '../types';
import { downloadSingleInvoicePDF, downloadBatchInvoicesAsZip } from '../services/BackgroundPDFGenerator';


interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  date: string;
  amount: number;
  paidAmount: number;
  balance: number;
  paymentMode: string;
  customerName?: string;
  customerPhone?: string; // Added for better linking
  dueDate?: string;
  products?: any[]; // Added to support full invoice view
  time?: string; // Added
}

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

const mapInvoiceToPrintData = (invoice: Invoice, customer: Customer, _companyDetails: CompanyDetails): InvoiceData => {
  return {
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.date,
    time: invoice.time || '10:00 AM', // Fallback
    dueDate: invoice.dueDate || '-',
    paymentMode: invoice.paymentMode,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerAddress: customer.address,
    products: (invoice.products || []).map((p: any, index: number) => ({
      sNo: index + 1,
      description: p.name || p.description,
      qty: p.quantity || p.qty,
      rate: p.price || p.rate,
      discountPercent: p.discount || p.discountPercent || 0,
      amount: p.amount
    })),
    subTotal: invoice.amount, // Approximate
    gstRate: 0,
    totalGst: 0,
    sgst: 0,
    cgst: 0,
    roundOff: 0,
    grandTotal: invoice.amount,
    paidAmount: invoice.paidAmount,
    balance: invoice.balance,
    amountInWords: numberToWords(invoice.amount)
  };
};

import { customerService, type Customer } from '../services/CustomerService';
import { CustomerBillsAPI } from '../services/CustomerBillsAPI';
import { authService } from '../services/AuthService';

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]); // Keep this for "Latest Invoice" calculation
  const [loading, setLoading] = useState(true);

  // Load Customers and Invoices
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedCustomers, fetchedInvoices] = await Promise.all([
        customerService.getAllCustomers().catch(err => { console.warn("Customers fetch failed", err); return []; }),
        CustomerBillsAPI.getAllInvoices().catch(err => { console.warn("Invoices fetch failed", err); return []; })
      ]);
      setCustomers(Array.isArray(fetchedCustomers) ? fetchedCustomers : []);
      setCustomerInvoices(Array.isArray(fetchedInvoices) ? fetchedInvoices as unknown as Invoice[] : []);
    } catch (error) {
      console.error("Failed to load data", error);
      setCustomers([]);
      setCustomerInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
  const [isAddSuccess, setIsAddSuccess] = useState(false);
  const [addError, setAddError] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);

  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    gstin: '',
    customerType: 'Retail' as 'Retail' | 'Wholesale',
    status: 'Active' as 'Active' | 'Inactive'
  });
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Company details
  const companyDetails: CompanyDetails = {
    name: 'VK INFOTECH',
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

  const handleDownloadPDF = async (invoice: Invoice, customer: Customer) => {
    setDownloadingInvoiceId(invoice.id);
    setDownloadError(null);
    try {
      const printData = mapInvoiceToPrintData(invoice, customer, companyDetails);
      await downloadSingleInvoicePDF(companyDetails, printData);
    } catch (error) {
      console.error("PDF Download failed", error);
      setDownloadError("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleDownloadAllPDF = async (customer: Customer, invoices: Invoice[]) => {
    if (invoices.length === 0) return;
    setIsBatchDownloading(true);
    setDownloadError(null);
    setBatchProgress({ current: 0, total: invoices.length });

    try {
      const allPrintData = invoices.map(inv => mapInvoiceToPrintData(inv, customer, companyDetails));
      await downloadBatchInvoicesAsZip(companyDetails, allPrintData, customer.name, {
        onProgress: (current, total) => setBatchProgress({ current, total })
      });
    } catch (error) {
      console.error("Batch PDF Download failed", error);
      setDownloadError("Failed to download all bills. Please try again.");
    } finally {
      setIsBatchDownloading(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  // Re-implement handlers using Service
  const handleAddCustomer = async () => {
    if (!customerForm.name || !customerForm.phone) {
      setAddError('Please fill required fields (Name and Phone)');
      return;
    }

    // Check for duplicate phone (client-side check for immediate feedback, server also handles unique)
    if (customers.some(c => c.phone === '+91 ' + customerForm.phone)) {
      setAddError('A customer with this phone number already exists');
      return;
    }

    setAddError('');

    // Create new customer via API
    const newCustomer = await customerService.addCustomer({
      name: customerForm.name,
      phone: '+91 ' + customerForm.phone,
      address: customerForm.address,
      email: customerForm.email,
      gstin: customerForm.gstin,
      customerType: customerForm.customerType,
      status: customerForm.status
    });

    if (newCustomer) {
      setCustomers([...customers, newCustomer]);
      setCustomerForm({
        name: '',
        phone: '',
        address: '',
        email: '',
        gstin: '',
        customerType: 'Retail',
        status: 'Active'
      });
      setIsAddSuccess(true);
      setTimeout(() => {
        setIsAddSuccess(false);
        setShowAddModal(false);
      }, 1500);
    } else {
      setAddError('Failed to create customer. Please try again.');
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer || !customerForm.name || !customerForm.phone) {
      alert('Please fill required fields');
      return;
    }

    // Update via API
    const updated = await customerService.updateCustomer(selectedCustomer.id, {
      name: customerForm.name,
      phone: '+91 ' + customerForm.phone,
      address: customerForm.address,
      email: customerForm.email,
      gstin: customerForm.gstin,
      customerType: customerForm.customerType,
      status: customerForm.status
    });

    if (updated) {
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? updated : c));
      setIsUpdateSuccess(true);
      setTimeout(() => {
        setIsUpdateSuccess(false);
        setShowEditModal(false);
        setSelectedCustomer(null);
      }, 1500);
    } else {
      alert('Failed to update customer');
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    // ... (keep existing UI state logic for modal)
    setDeleteTarget(customer);
    setShowDeleteModal(true);
    setShowDeleteSuccess(false);
    setIsDeleting(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const success = await customerService.deleteCustomer(deleteTarget.id);
    if (success) {
      setCustomers(customers.filter(c => c.id !== deleteTarget.id));
      setIsDeleting(false);
      setShowDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteModal(false);
        setDeleteTarget(null);
        setShowDeleteSuccess(false);
      }, 2000);
    } else {
      setIsDeleting(false);
      alert('Failed to delete customer');
    }
  };

  const handleExportExcel = (range: string) => {
    try {
      const dataToExport = filteredCustomers.map(c => ({
        'Customer ID': c.id,
        'Name': c.name,
        'Phone': c.phone,
        'Email': c.email || '',
        'Address': c.address || '',
        'GSTIN': c.gstin || '',
        'Type': c.customerType,
        'Status': c.status,
        'Total Purchases': c.totalPurchases,
        'Total Orders': c.totalOrders,
        'Last Purchase': c.lastPurchaseDate || '',
        'Created At': c.createdAt || ''
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");
      XLSX.writeFile(wb, `Customers_Report_${range}_${new Date().toISOString().split('T')[0]}.xlsx`);
      setShowExportModal(false);
    } catch (error) {
      console.error("Excel Export failed", error);
      alert("Failed to export to Excel");
    }
  };

  const handleViewHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const handleViewBill = (billId: string) => {
    if (!selectedCustomer) return;
    navigate(`/customers/${selectedCustomer.id}/bill/${billId}`);
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone.replace('+91 ', ''),
      address: customer.address || '',
      email: customer.email || '',
      gstin: customer.gstin || '',
      customerType: customer.customerType || 'Retail',
      status: customer.status || 'Active'
    });
    setShowEditModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };




  // Derived State & Stats
  const filteredCustomers = (customers || []).filter(customer => {
    const matchesSearch = (customer.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (customer.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = !filterType || customer.customerType === filterType;
    const matchesStatus = !filterStatus || customer.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'Active').length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const newCustomersMonth = customers.filter(c => {
    if (!c.createdAt) return false;
    const d = new Date(c.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const topCustomers = [...customers].sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
          <p className="text-gray-500 mt-1">Manage customer database and purchase history</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all hover:scale-105"
          >
            <Plus size={20} />
            Add Customer
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all hover:scale-105"
          >
            <FileSpreadsheet size={20} />
            Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Customers</p>
              <p className="text-gray-800 text-2xl font-bold">{totalCustomers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <UserCheck className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Customers</p>
              <p className="text-gray-800 text-2xl font-bold">{activeCustomers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <UserPlus className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">New This Month</p>
              <p className="text-gray-800 text-2xl font-bold">{newCustomersMonth}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Top Customer</p>
              <p className="text-gray-800 text-lg font-bold">
                {topCustomers[0] ? `₹${(topCustomers[0].totalPurchases / 1000).toFixed(0)}K` : '₹0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, or ID..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Types</option>
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-4 text-gray-600 font-semibold">Customer ID</th>
                <th className="text-left py-4 px-4 text-gray-600 font-semibold">Name</th>
                <th className="text-left py-4 px-4 text-gray-600 font-semibold">Contact</th>
                <th className="text-left py-4 px-4 text-gray-600 font-semibold">GSTIN</th>
                <th className="text-left py-4 px-4 text-gray-600 font-semibold">Last Invoice</th>
                <th className="text-left py-4 px-4 text-gray-600 font-semibold">Total Purchase</th>
                <th className="text-left py-4 px-4 text-gray-600 font-semibold">Paid Amount</th>
                <th className="text-left py-4 px-4 text-gray-600 font-semibold">Orders</th>
                <th className="text-left py-4 px-4 text-gray-600 font-semibold">Payment Mode</th>
                <th className="text-left py-4 px-4 text-gray-600 font-semibold">Due Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium">No customers found</p>
                    <p className="text-sm">Try adjusting your search or add a new customer</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  // Derive details from invoices
                  const myInvoices = customerInvoices.filter(inv =>
                    (inv.customerId && inv.customerId === customer.id) ||
                    (inv.customerPhone && customer.phone && inv.customerPhone === customer.phone) ||
                    (!inv.customerId && inv.customerName && customer.name && inv.customerName === customer.name)
                  );

                  // Payment Mode (Last used)
                  // Payment Mode (Last used)
                  const lastInvoice = [...myInvoices].sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    return dateB - dateA;
                  })[0];
                  const lastPaymentMode = lastInvoice ? lastInvoice.paymentMode : '-';

                  // Due Details
                  const unpaidInvoices = myInvoices.filter(inv => (inv.balance || 0) > 0);
                  const totalDue = unpaidInvoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
                  const dueText = totalDue > 0 ? `₹${totalDue.toLocaleString()}` : 'Nil';

                  const totalPaid = myInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

                  return (
                    <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-800 font-medium">{customer.id}</td>
                      <td className="py-3 px-4">
                        <div className="text-gray-800 font-medium">{customer.name}</div>
                        {customer.email && <div className="text-gray-500 text-xs mt-0.5">{customer.email}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-800 font-medium">{customer.phone}</div>
                        {customer.address && <div className="text-gray-500 text-xs mt-0.5 truncat max-w-[150px]">{customer.address}</div>}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {customer.gstin || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">
                          {(() => {
                            // Find latest invoice
                            const latestInv = [...myInvoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                            return latestInv ? latestInv.invoiceNumber : '-';
                          })()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-800 font-bold">₹{customer.totalPurchases.toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-green-600 font-bold">₹{totalPaid.toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-bold">
                          {customer.totalOrders}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${lastPaymentMode === 'Online' || lastPaymentMode === 'UPI' ? 'bg-purple-100 text-purple-700' :
                          lastPaymentMode === 'Cash' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                          {lastPaymentMode || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {totalDue > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-red-600 font-bold">{dueText}</span>
                            <span className="text-red-400 text-[10px]">{unpaidInvoices.length} Bills Due</span>
                          </div>
                        ) : (
                          <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Nil</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {customer.branch || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm font-medium">
                        {customer.createdBy || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="py-3 px-4 flex justify-center gap-2">
                        <button
                          onClick={() => handleViewHistory(customer)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-1"
                        >
                          <FileSpreadsheet size={14} />
                          View Bills
                        </button>
                        <button
                          onClick={() => openEditModal(customer)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                          title="Edit Details"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer)}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Customers Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-600" size={24} />
          Top Customers by Purchase Value
        </h2>
        <div className="space-y-3">
          {topCustomers.map((customer, index) => (
            <div key={customer.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                  }`}>
                  #{index + 1}
                </div>
                <div>
                  <div className="text-gray-800 font-semibold">{customer.name}</div>
                  <div className="text-gray-500 text-sm">{customer.phone}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-600 font-bold text-lg">₹{customer.totalPurchases.toLocaleString()}</div>
                <div className="text-gray-500 text-sm">{customer.totalOrders} orders</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Add New Customer</h2>
              <button
                onClick={() => { setShowAddModal(false); setIsAddSuccess(false); setAddError(''); }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {isAddSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center min-h-[350px]">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-[ping_1s_ease-out_infinite]"></div>
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-full animate-[bounce_0.5s_ease-out]">
                    <CheckCircle size={48} className="text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-green-600 uppercase tracking-widest animate-pulse mb-2">
                  Added!
                </h3>
                <p className="text-gray-500 font-medium mb-6">
                  Customer successfully added to database.
                </p>
                <button
                  onClick={() => {
                    setIsAddSuccess(false);
                    setShowAddModal(false);
                  }}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {addError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium text-sm">
                    {addError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm mb-2 font-medium">Customer Name *</label>
                    <input
                      type="text"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-2 font-medium">Phone Number *</label>
                    <div className="flex items-center border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-green-500">
                      <span className="pl-4 pr-1 py-2 text-gray-800 font-semibold select-none whitespace-nowrap">+91</span>
                      <input
                        type="tel"
                        value={customerForm.phone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setCustomerForm({ ...customerForm, phone: digits });
                        }}
                        className="w-full px-2 py-2 bg-transparent text-gray-800 focus:outline-none"
                        placeholder="9876543210"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-2 font-medium">Email (Optional)</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="customer@email.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-2 font-medium">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={customerForm.gstin}
                    onChange={(e) => setCustomerForm({ ...customerForm, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
                    placeholder="GSTIN Number"
                    maxLength={15}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-2 font-medium">Address</label>
                  <textarea
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Enter customer address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm mb-2 font-medium">Customer Type</label>
                    <select
                      value={customerForm.customerType}
                      onChange={(e) => setCustomerForm({ ...customerForm, customerType: e.target.value as 'Retail' | 'Wholesale' })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Retail">Retail</option>
                      <option value="Wholesale">Wholesale</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-2 font-medium">Status</label>
                    <select
                      value={customerForm.status}
                      onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value as 'Active' | 'Inactive' })}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomer}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-lg transition-all hover:scale-105"
                  >
                    Add Customer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Edit Customer</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-2 font-medium">Customer Name *</label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-2 font-medium">Phone Number *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-green-500">
                    <span className="pl-4 pr-1 py-2 text-gray-800 font-semibold select-none whitespace-nowrap">+91</span>
                    <input
                      type="tel"
                      value={customerForm.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setCustomerForm({ ...customerForm, phone: digits });
                      }}
                      className="w-full px-2 py-2 bg-transparent text-gray-800 focus:outline-none"
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-2 font-medium">Email (Optional)</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="customer@email.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-2 font-medium">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={customerForm.gstin}
                  onChange={(e) => setCustomerForm({ ...customerForm, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
                  placeholder="GSTIN Number"
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-2 font-medium">Address</label>
                <textarea
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Enter customer address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-2 font-medium">Customer Type</label>
                  <select
                    value={customerForm.customerType}
                    onChange={(e) => setCustomerForm({ ...customerForm, customerType: e.target.value as 'Retail' | 'Wholesale' })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm mb-2 font-medium">Status</label>
                  <select
                    value={customerForm.status}
                    onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditCustomer}
                  disabled={isUpdateSuccess}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 transform ${isUpdateSuccess
                    ? 'bg-green-600 hover:bg-green-700 text-white scale-105'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                    }`}
                >
                  {isUpdateSuccess ? (
                    <div className="flex items-center justify-center gap-2 animate-bounce">
                      <Check size={20} />
                      <span>Updated Successfully!</span>
                    </div>
                  ) : (
                    'Update Customer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer History Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Customer History</h2>
                <p className="text-gray-500 mt-1">{selectedCustomer.name} - {selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Customer Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <DollarSign size={18} />
                    <span className="text-sm font-medium">Total Purchases</span>
                  </div>
                  <div className="text-gray-800 text-2xl font-bold">
                    ₹{selectedCustomer.totalPurchases.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <ShoppingBag size={18} />
                    <span className="text-sm font-medium">Total Orders</span>
                  </div>
                  <div className="text-gray-800 text-2xl font-bold">{selectedCustomer.totalOrders}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Calendar size={18} />
                    <span className="text-sm font-medium">Last Purchase</span>
                  </div>
                  <div className="text-gray-800 text-lg font-bold">
                    {selectedCustomer.lastPurchaseDate || 'N/A'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <UserCheck size={18} />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${selectedCustomer.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                      }`}>
                      {selectedCustomer.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice History */}
              {(() => {
                // Compute invoices for the selected customer
                const currentCustomerInvoices = selectedCustomer ? customerInvoices.filter(inv =>
                  inv.customerId === selectedCustomer.id ||
                  (inv.customerPhone && inv.customerPhone === selectedCustomer.phone) ||
                  (!inv.customerId && inv.customerName === selectedCustomer.name)
                ) : [];

                return (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Invoice History</h3>
                      <button
                        onClick={() => selectedCustomer && handleDownloadAllPDF(selectedCustomer, currentCustomerInvoices)}
                        disabled={isBatchDownloading || currentCustomerInvoices.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white transition-all
                     ${isBatchDownloading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:scale-105'}
                   `}
                      >
                        {isBatchDownloading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Processing {batchProgress.current}/{batchProgress.total}</span>
                          </>
                        ) : (
                          <>
                            <Layers size={18} />
                            <span>Download All Bills</span>
                          </>
                        )}
                      </button>
                    </div>
                    {currentCustomerInvoices.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No purchase history found
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left py-3 px-3 text-gray-600 font-bold">Invoice No</th>
                              <th className="text-left py-3 px-3 text-gray-600 font-bold">Date</th>
                              <th className="text-left py-3 px-3 text-gray-600 font-bold">Amount</th>
                              <th className="text-left py-3 px-3 text-gray-600 font-bold">Paid</th>
                              <th className="text-left py-3 px-3 text-gray-600 font-bold">Balance</th>
                              <th className="text-left py-3 px-3 text-gray-600 font-bold">Payment Mode</th>
                              <th className="text-center py-3 px-3 text-gray-600 font-bold">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentCustomerInvoices.map((invoice: Invoice) => (
                              <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-3 text-gray-800 font-semibold">{invoice.invoiceNumber}</td>
                                <td className="py-3 px-3 text-gray-600">{invoice.date}</td>
                                <td className="py-3 px-3 text-gray-800 font-bold">₹{invoice.amount.toLocaleString()}</td>
                                <td className="py-3 px-3 text-green-600">₹{invoice.paidAmount.toLocaleString()}</td>
                                <td className="py-3 px-3">
                                  <span className={invoice.balance > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                                    ₹{invoice.balance.toLocaleString()}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-gray-600">{invoice.paymentMode}</td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleViewBill(invoice.id)}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                      title="View Bill"
                                    >
                                      <Eye size={18} />
                                    </button>
                                    <button
                                      onClick={() => selectedCustomer && handleDownloadPDF(invoice, selectedCustomer)}
                                      disabled={downloadingInvoiceId === invoice.id || isBatchDownloading}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                      title="Download PDF"
                                    >
                                      {downloadingInvoiceId === invoice.id ? (
                                        <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
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
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Export Date Range Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Select Export Range</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">Choose the time period for customer data export:</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleExportExcel('daily')}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-xl transition-all hover:scale-105"
              >
                <Clock size={24} className="text-blue-600" />
                <span className="font-semibold text-gray-800">Daily</span>
                <span className="text-xs text-gray-600">Today's Data</span>
              </button>

              <button
                onClick={() => handleExportExcel('weekly')}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400 rounded-xl transition-all hover:scale-105"
              >
                <Calendar size={24} className="text-green-600" />
                <span className="font-semibold text-gray-800">Weekly</span>
                <span className="text-xs text-gray-600">Last 7 Days</span>
              </button>

              <button
                onClick={() => handleExportExcel('monthly')}
                className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-400 rounded-xl transition-all hover:scale-105"
              >
                <BarChart3 size={24} className="text-purple-600" />
                <span className="font-semibold text-gray-800">Monthly</span>
                <span className="text-xs text-gray-600">Last 30 Days</span>
              </button>

              <button
                onClick={() => handleExportExcel('yearly')}
                className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-400 rounded-xl transition-all hover:scale-105"
              >
                <TrendingUp size={24} className="text-orange-600" />
                <span className="font-semibold text-gray-800">Yearly</span>
                <span className="text-xs text-gray-600">Last Year</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Glitch Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className={`relative bg-gray-900 border-2 border-red-500 text-red-500 p-8 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.6)] w-[400px] text-center overflow-hidden
            ${isDeleting ? 'animate-pulse' : ''}`}>

            {/* Glitch Overlay Effects */}
            {isDeleting && (
              <div className="absolute inset-0 bg-red-500/10 pointer-events-none mix-blend-overlay animate-ping"></div>
            )}

            {!showDeleteSuccess ? (
              <>
                <div className="mb-6 relative">
                  <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500 relative">
                    <Trash2 size={40} className={`text-red-500 ${isDeleting ? 'animate-bounce' : ''}`} />
                    {isDeleting && (
                      <div className="absolute inset-0 border-4 border-red-500 rounded-full animate-ping opacity-20"></div>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black uppercase tracking-widest mb-2" style={{ textShadow: '2px 2px 0 #000' }}>
                  Confirm Deletion
                </h3>
                <p className="text-red-300 text-sm mb-8 font-mono">
                  Are you sure you want to eliminate <br />
                  <span className="font-bold text-white bg-red-600 px-1">{deleteTarget?.name}</span>?
                  <br /> This action is <span className="underline decoration-wavy">irreversible</span>.
                </p>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={cancelDelete}
                    disabled={isDeleting}
                    className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all font-mono uppercase text-sm tracking-wider"
                  >
                    Abort
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="px-6 py-2 bg-red-600 text-white hover:bg-red-700 transition-all font-mono uppercase text-sm tracking-wider shadow-[4px_4px_0_#991b1b] active:translate-y-1 active:shadow-none relative overflow-hidden group"
                  >
                    {isDeleting ? 'Purging...' : 'Execute'}
                    {/* Button Glitch Effect */}
                    <span className="absolute top-0 left-[-100%] w-full h-full bg-white/20 skew-x-[45deg] group-hover:animate-[shimmer_1s_infinite]"></span>
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-[ping_1s_ease-out_infinite]"></div>
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-full animate-[bounce_0.5s_ease-out]">
                    <CheckCircle size={48} className="text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-green-500 uppercase tracking-widest animate-pulse">
                  Deleted
                </h3>
                <p className="text-green-300 font-mono text-sm mt-2">Target successfully removed.</p>
              </div>
            )}

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{ background: 'linear-gradient(to bottom, transparent 50%, #000 50%)', backgroundSize: '100% 4px' }}>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {downloadError && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-5">
          <p className="font-semibold">{downloadError}</p>
        </div>
      )}
    </div>
  );
}
