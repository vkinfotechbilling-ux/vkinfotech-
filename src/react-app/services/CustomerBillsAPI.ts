/**
 * CustomerBillsAPI Service
 * 
 * Dedicated API service for customer bill history operations.
 * This service is ONLY for fetching and viewing historical bills.
 * 
 * DO NOT use this for creating or editing bills - use BillingAPI instead.
 */

import { supabase } from '../lib/supabaseClient';

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
    branch?: string;
    createdBy?: string;
}

// Helper to convert snake_case DB row to camelCase CustomerBill
function toBill(row: any): CustomerBill {
    return {
        id: row.id,
        invoiceNumber: row.invoice_number,
        customerId: row.customer_id || '',
        date: row.date,
        time: row.time || '',
        amount: row.amount || 0,
        paidAmount: row.paid_amount || 0,
        balance: row.balance || 0,
        paymentMode: row.payment_mode || 'Cash',
        customerName: row.customer_name || '',
        customerPhone: row.customer_phone || '',
        customerAddress: row.customer_address || '',
        dueDate: row.due_date || '',
        products: row.products || [],
        branch: row.branch,
        createdBy: row.created_by
    };
}

export const CustomerBillsAPI = {
    /**
     * Fetch all bills for a specific customer
     */
    getCustomerBills: async (customerId: string): Promise<CustomerBill[]> => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('customer_id', customerId)
                .order('date', { ascending: false });

            if (error) throw error;
            return (data || []).map(toBill);
        } catch (error) {
            console.error('Error fetching customer bills:', error);
            return [];
        }
    },

    /**
     * Fetch a single bill by invoice ID
     */
    getCustomerBill: async (invoiceId: string): Promise<CustomerBill | null> => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', invoiceId)
                .single();

            if (error || !data) return null;
            return toBill(data);
        } catch (error) {
            console.error('Error fetching customer bill:', error);
            return null;
        }
    },

    /**
     * Get customer information by ID
     */
    getCustomer: async (customerId: string): Promise<any> => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', customerId)
                .single();

            if (error || !data) return null;

            // Convert to camelCase
            return {
                id: data.id,
                name: data.name,
                phone: data.phone,
                address: data.address,
                email: data.email,
                gstin: data.gstin,
                customerType: data.customer_type,
                status: data.status,
                totalPurchases: data.total_purchases,
                totalOrders: data.total_orders,
                lastPurchaseDate: data.last_purchase_date,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                branch: data.branch,
                createdBy: data.created_by
            };
        } catch (error) {
            console.error('Error fetching customer:', error);
            return null;
        }
    },

    /**
     * Fetch all invoices (for admin/summary views)
     */
    getAllInvoices: async (): Promise<CustomerBill[]> => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            return (data || []).map(toBill);
        } catch (error) {
            console.error('Error fetching all invoices:', error);
            return [];
        }
    },

    /**
     * Calculate customer statistics
     */
    getCustomerStats: async (customerId: string) => {
        const bills = await CustomerBillsAPI.getCustomerBills(customerId);

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
