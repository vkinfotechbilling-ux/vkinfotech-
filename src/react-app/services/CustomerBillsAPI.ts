/**
 * CustomerBillsAPI Service
 * 
 * Dedicated API service for customer bill history operations.
 * This service is ONLY for fetching and viewing historical bills.
 * 
 * DO NOT use this for creating or editing bills - use BillingAPI instead.
 */

export interface CustomerBill {
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

export const CustomerBillsAPI = {
    /**
     * Fetch all bills for a specific customer
     * @param customerId - Customer ID or phone number
     * @returns Array of customer bills
     */
    getCustomerBills: (customerId: string): CustomerBill[] => {
        try {
            const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            const customers = JSON.parse(localStorage.getItem('customers') || '[]');

            // Find customer by ID or phone
            const customer = customers.find((c: any) =>
                c.id === customerId || c.phone === customerId
            );

            if (!customer) {
                console.warn(`Customer not found: ${customerId}`);
                return [];
            }

            // Filter invoices for this customer
            const customerBills = allInvoices.filter((inv: CustomerBill) =>
                inv.customerId === customer.id ||
                (inv.customerPhone && inv.customerPhone === customer.phone) ||
                (!inv.customerId && inv.customerName === customer.name)
            );

            // Sort by date (newest first)
            return customerBills.sort((a: CustomerBill, b: CustomerBill) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        } catch (error) {
            console.error('Error fetching customer bills:', error);
            return [];
        }
    },

    /**
     * Fetch a single bill by invoice ID
     * @param invoiceId - Invoice ID
     * @returns Single customer bill or null
     */
    getCustomerBill: (invoiceId: string): CustomerBill | null => {
        try {
            const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            const bill = allInvoices.find((inv: CustomerBill) =>
                inv.id === invoiceId || inv.invoiceNumber === invoiceId
            );
            return bill || null;
        } catch (error) {
            console.error('Error fetching customer bill:', error);
            return null;
        }
    },

    /**
     * Get customer information by ID
     * @param customerId - Customer ID or phone number
     * @returns Customer object or null
     */
    getCustomer: (customerId: string): any => {
        try {
            const customers = JSON.parse(localStorage.getItem('customers') || '[]');
            return customers.find((c: any) =>
                c.id === customerId || c.phone === customerId
            ) || null;
        } catch (error) {
            console.error('Error fetching customer:', error);
            return null;
        }
    },

    /**
     * Calculate customer statistics
     * @param customerId - Customer ID or phone number
     * @returns Customer statistics
     */
    getCustomerStats: (customerId: string) => {
        const bills = CustomerBillsAPI.getCustomerBills(customerId);

        const totalPurchases = bills.reduce((sum, bill) => sum + bill.amount, 0);
        const totalPaid = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
        const totalDue = bills.reduce((sum, bill) => sum + bill.balance, 0);
        const unpaidBills = bills.filter(bill => bill.balance > 0);

        return {
            totalBills: bills.length,
            totalPurchases,
            totalPaid,
            totalDue,
            unpaidBillsCount: unpaidBills.length,
            lastBillDate: bills.length > 0 ? bills[0].date : null,
            lastBillNumber: bills.length > 0 ? bills[0].invoiceNumber : null
        };
    }
};
