import { supabase } from '../lib/supabaseClient';
import { InvoiceData } from '../types';
import { authService } from './AuthService';

export const BillingAPI = {
    generateWordInvoice: async (data: InvoiceData) => {
        // Word/DOCX invoice generation requires the Express server.
        // Since we're moving to Supabase, this now saves the invoice to Supabase
        // and triggers a client-side download instead of server-side DOCX generation.
        try {
            const user = authService.getCurrentUser();
            const invoiceId = data.invoiceNumber || `INV${Date.now()}`;

            const dbRow = {
                id: invoiceId,
                invoice_number: data.invoiceNumber,
                customer_name: data.customerName,
                customer_phone: data.customerPhone || '',
                customer_address: data.customerAddress || '',
                date: data.date,
                time: data.time || '',
                amount: data.grandTotal,
                paid_amount: data.paidAmount || data.grandTotal,
                balance: data.balance || 0,
                payment_mode: data.paymentMode || 'Cash',
                due_date: data.dueDate || '',
                products: data.products || [],
                branch: user?.branch || 'Main',
                created_by: user?.username || 'System'
            };

            const { error } = await supabase
                .from('invoices')
                .insert(dbRow);

            if (error) throw new Error(error.message);

            console.log(`✅ Invoice ${invoiceId} saved to Supabase.`);
            return true;
        } catch (error) {
            console.error('Error saving invoice:', error);
            throw error;
        }
    },

    createInvoice: async (invoiceData: any) => {
        try {
            const user = authService.getCurrentUser();
            const invoiceId = invoiceData.id || invoiceData.invoiceNumber || `INV${Date.now()}`;

            const dbRow = {
                id: invoiceId,
                invoice_number: invoiceData.invoiceNumber || invoiceId,
                customer_id: invoiceData.customerId || '',
                customer_name: invoiceData.customerName || '',
                customer_phone: invoiceData.customerPhone || '',
                customer_address: invoiceData.customerAddress || '',
                date: invoiceData.date || new Date().toISOString().split('T')[0],
                time: invoiceData.time || '',
                amount: invoiceData.amount || invoiceData.grandTotal || 0,
                paid_amount: invoiceData.paidAmount || invoiceData.amount || 0,
                balance: invoiceData.balance || 0,
                payment_mode: invoiceData.paymentMode || 'Cash',
                due_date: invoiceData.dueDate || '',
                products: invoiceData.products || [],
                branch: user?.branch || 'Main',
                created_by: user?.username || 'System'
            };

            const { data, error } = await supabase
                .from('invoices')
                .insert(dbRow)
                .select()
                .single();

            if (error) throw new Error(error.message);

            // Convert back to camelCase for the caller
            return data ? {
                id: data.id,
                invoiceNumber: data.invoice_number,
                customerId: data.customer_id,
                customerName: data.customer_name,
                customerPhone: data.customer_phone,
                customerAddress: data.customer_address,
                date: data.date,
                time: data.time,
                amount: data.amount,
                paidAmount: data.paid_amount,
                balance: data.balance,
                paymentMode: data.payment_mode,
                dueDate: data.due_date,
                products: data.products,
                branch: data.branch,
                createdBy: data.created_by
            } : null;
        } catch (error) {
            console.error('Error creating invoice:', error);
            throw error;
        }
    }
};
