export interface InvoiceProduct {
    sNo: number;
    description: string;
    qty: number;
    rate: number;
    discountPercent: number;
    amount: number;
}

export interface InvoiceData {
    invoiceNumber: string;
    date: string;
    time: string;
    dueDate: string;
    dueTime: string;
    paymentMode: string;
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    products: InvoiceProduct[];
    subTotal: number;
    gstRate: number;
    totalGst: number;
    cgst: number;
    sgst: number;
    roundOff: number;
    grandTotal: number;
    amountInWords: string;
    paidAmount?: number;
    balance?: number;
    // PDF Service specific fields (unifying)
    payMode?: string; // unifying to paymentMode ideally, but keeping compatibility
    balanceAmount?: number; // compat
}

export interface CompanyDetails {
    name: string;
    tagline: string;
    address: string;
    mobile: string;
    email: string;
    gstin: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    upiId: string;
    terms?: string;
    qrCode?: string;
    bankHolder?: string;
    logo?: string;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    customerId: string;
    date: string;
    time: string;
    amount: number;
    paidAmount: number;
    balance: number;
    paymentMode: string;
    products: any[];
    customerName: string;
    customerPhone: string;
    customerAddress: string;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string;
    email: string;
    customerType: string;
    status: string;
    totalPurchases: number;
    totalOrders: number;
    lastPurchaseDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    id: string;
    name: string;
    brand: string;
    price: number;
    stock: number;
    category: string;
    gstRate: number;
    hsnCode: string;
}
