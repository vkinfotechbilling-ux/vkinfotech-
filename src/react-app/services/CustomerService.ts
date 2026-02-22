import { supabase } from '../lib/supabaseClient';
import { authService } from './AuthService';

export interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string;
    email: string;
    gstin: string;
    customerType: 'Retail' | 'Wholesale';
    status: 'Active' | 'Inactive';
    totalPurchases: number;
    totalOrders: number;
    lastPurchaseDate: string;
    createdAt: string;
    updatedAt: string;
    branch?: string;
    createdBy?: string;
}

// Helper to convert snake_case DB row to camelCase Customer
function toCustomer(row: any): Customer {
    return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        address: row.address || '',
        email: row.email || '',
        gstin: row.gstin || '',
        customerType: row.customer_type || 'Retail',
        status: row.status || 'Active',
        totalPurchases: row.total_purchases || 0,
        totalOrders: row.total_orders || 0,
        lastPurchaseDate: row.last_purchase_date || '',
        createdAt: row.created_at || '',
        updatedAt: row.updated_at || '',
        branch: row.branch,
        createdBy: row.created_by
    };
}

// Helper to convert camelCase Customer to snake_case DB row
function toDbRow(customer: Partial<Customer>) {
    const row: any = {};
    if (customer.id !== undefined) row.id = customer.id;
    if (customer.name !== undefined) row.name = customer.name;
    if (customer.phone !== undefined) row.phone = customer.phone;
    if (customer.address !== undefined) row.address = customer.address;
    if (customer.email !== undefined) row.email = customer.email;
    if (customer.gstin !== undefined) row.gstin = customer.gstin;
    if (customer.customerType !== undefined) row.customer_type = customer.customerType;
    if (customer.status !== undefined) row.status = customer.status;
    if (customer.totalPurchases !== undefined) row.total_purchases = customer.totalPurchases;
    if (customer.totalOrders !== undefined) row.total_orders = customer.totalOrders;
    if (customer.lastPurchaseDate !== undefined) row.last_purchase_date = customer.lastPurchaseDate;
    if (customer.branch !== undefined) row.branch = customer.branch;
    if (customer.createdBy !== undefined) row.created_by = customer.createdBy;
    return row;
}

class CustomerService {
    async getAllCustomers(): Promise<Customer[]> {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(toCustomer);
        } catch (error) {
            console.error('Error fetching customers:', error);
            return [];
        }
    }

    async getCustomerById(id: string): Promise<Customer | undefined> {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) return undefined;
            return toCustomer(data);
        } catch (error) {
            console.error('Error fetching customer:', error);
            return undefined;
        }
    }

    async addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchases' | 'totalOrders' | 'lastPurchaseDate'>): Promise<Customer | null> {
        try {
            const user = authService.getCurrentUser();
            const now = new Date().toISOString().split('T')[0];
            const newId = `VKC${Date.now()}`;

            const dbRow = {
                ...toDbRow(customer),
                id: newId,
                branch: user?.branch || 'Main',
                created_by: user?.username || 'System',
                created_at: now,
                updated_at: now,
                total_purchases: 0,
                total_orders: 0,
                last_purchase_date: ''
            };

            const { data, error } = await supabase
                .from('customers')
                .insert(dbRow)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data ? toCustomer(data) : null;
        } catch (error) {
            console.error('Error adding customer:', error);
            return null;
        }
    }

    async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
        try {
            const dbUpdates = {
                ...toDbRow(updates),
                updated_at: new Date().toISOString().split('T')[0]
            };

            const { data, error } = await supabase
                .from('customers')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data ? toCustomer(data) : null;
        } catch (error) {
            console.error('Error updating customer:', error);
            return null;
        }
    }

    async deleteCustomer(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id);

            return !error;
        } catch (error) {
            console.error('Error deleting customer:', error);
            return false;
        }
    }
}

export const customerService = new CustomerService();
