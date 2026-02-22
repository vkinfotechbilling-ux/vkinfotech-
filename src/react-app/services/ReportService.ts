import { supabase } from '../lib/supabaseClient';
import { type Invoice, type Customer, type Product } from '../types';

export interface ReportSummary {
    totalSales: number;
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    profit: number;
    stockValue: number;
}

export interface SalesReportParams {
    startDate?: Date;
    endDate?: Date;
    paymentMode?: string;
    customerId?: string;
}

export class ReportService {
    private async getInvoices(): Promise<Invoice[]> {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;

            return (data || []).map((row: any) => ({
                id: row.id,
                invoiceNumber: row.invoice_number,
                customerId: row.customer_id || '',
                date: row.date,
                time: row.time || '',
                amount: row.amount || 0,
                paidAmount: row.paid_amount || 0,
                balance: row.balance || 0,
                paymentMode: row.payment_mode || 'Cash',
                products: row.products || [],
                customerName: row.customer_name || '',
                customerPhone: row.customer_phone || '',
                customerAddress: row.customer_address || ''
            }));
        } catch (error) {
            console.error('Error fetching invoices for reports:', error);
            return [];
        }
    }

    private async getCustomers(): Promise<Customer[]> {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*');

            if (error) throw error;

            return (data || []).map((row: any) => ({
                id: row.id,
                name: row.name,
                phone: row.phone,
                address: row.address || '',
                email: row.email || '',
                customerType: row.customer_type || 'Retail',
                status: row.status || 'Active',
                totalPurchases: row.total_purchases || 0,
                totalOrders: row.total_orders || 0,
                lastPurchaseDate: row.last_purchase_date || '',
                createdAt: row.created_at || '',
                updatedAt: row.updated_at || ''
            }));
        } catch (error) {
            console.error('Error fetching customers for reports:', error);
            return [];
        }
    }

    private async getProducts(): Promise<Product[]> {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*');

            if (error) throw error;

            return (data || []).map((row: any) => ({
                id: row.id,
                name: row.name,
                brand: row.brand || '',
                category: row.category || '',
                description: row.description || '',
                price: row.price || 0,
                stock: row.stock || 0,
                minStock: row.min_stock || 0,
                unit: row.unit || 'pcs',
                status: row.status || 'Active',
                serialNumber: row.serial_number || '',
                warranty: row.warranty || '',
                model: row.model || '',
                gstRate: row.gst_rate || 0,
                hsnCode: row.hsn_code || '',
                createdAt: row.created_at || '',
                updatedAt: row.updated_at || '',
                branch: row.branch,
                createdBy: row.created_by
            }));
        } catch (error) {
            console.error('Error fetching products for reports:', error);
            return [];
        }
    }

    async getSummaryMetrics(): Promise<ReportSummary> {
        const [invoices, customers, products] = await Promise.all([
            this.getInvoices(),
            this.getCustomers(),
            this.getProducts()
        ]);

        const totalSales = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const totalOrders = invoices.length;
        const totalCustomers = customers.length;
        const profit = totalSales * 0.2;
        const stockValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);

        return {
            totalSales,
            totalRevenue: totalSales,
            totalOrders,
            totalCustomers,
            profit,
            stockValue
        };
    }

    async getSalesReport(params: SalesReportParams) {
        let invoices = await this.getInvoices();

        if (params.startDate) {
            invoices = invoices.filter(inv => new Date(inv.date) >= params.startDate!);
        }
        if (params.endDate) {
            invoices = invoices.filter(inv => new Date(inv.date) <= params.endDate!);
        }

        const salesByDate: Record<string, number> = {};
        invoices.forEach(inv => {
            const date = inv.date;
            salesByDate[date] = (salesByDate[date] || 0) + inv.amount;
        });

        return Object.entries(salesByDate).map(([date, amount]) => ({ date, amount }));
    }

    async getTopSellingProducts() {
        const invoices = await this.getInvoices();
        const productSales: Record<string, number> = {};

        invoices.forEach(inv => {
            if (inv.products && Array.isArray(inv.products)) {
                inv.products.forEach((p: any) => {
                    productSales[p.name] = (productSales[p.name] || 0) + (p.quantity || 0);
                });
            }
        });

        return Object.entries(productSales)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }

    async getRecentTransactions() {
        const invoices = await this.getInvoices();
        return invoices.slice(0, 5);
    }

    async getFinancialSummary() {
        const invoices = await this.getInvoices();
        const totalGST = invoices.reduce((sum, inv) => {
            const gstComponent = inv.amount - (inv.amount / 1.18);
            return sum + gstComponent;
        }, 0);

        return {
            totalGST,
            netRevenue: invoices.reduce((sum, inv) => sum + (inv.amount / 1.18), 0)
        };
    }
}

export const reportService = new ReportService();
