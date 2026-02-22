import { supabase } from '../lib/supabaseClient';
import { authService } from './AuthService';
import { type Product } from '../types';
export type { Product };

// Helper to convert snake_case DB row to camelCase Product
function toProduct(row: any): Product {
    return {
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
    };
}

// Helper to convert camelCase Product to snake_case DB row
function toDbRow(product: Partial<Product>) {
    const row: any = {};
    if (product.id !== undefined) row.id = product.id;
    if (product.name !== undefined) row.name = product.name;
    if (product.brand !== undefined) row.brand = product.brand;
    if (product.category !== undefined) row.category = product.category;
    if (product.description !== undefined) row.description = product.description;
    if (product.price !== undefined) row.price = product.price;
    if (product.stock !== undefined) row.stock = product.stock;
    if (product.minStock !== undefined) row.min_stock = product.minStock;
    if (product.unit !== undefined) row.unit = product.unit;
    if (product.status !== undefined) row.status = product.status;
    if (product.serialNumber !== undefined) row.serial_number = product.serialNumber;
    if (product.warranty !== undefined) row.warranty = product.warranty;
    if (product.model !== undefined) row.model = product.model;
    if (product.gstRate !== undefined) row.gst_rate = product.gstRate;
    if (product.hsnCode !== undefined) row.hsn_code = product.hsnCode;
    if (product.branch !== undefined) row.branch = product.branch;
    if (product.createdBy !== undefined) row.created_by = product.createdBy;
    return row;
}

class ProductService {
    async getAllProducts(): Promise<Product[]> {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(toProduct);
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    async getProductById(id: string): Promise<Product | undefined> {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) return undefined;
            return toProduct(data);
        } catch (error) {
            console.error('Error fetching product:', error);
            return undefined;
        }
    }

    async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> {
        try {
            const user = authService.getCurrentUser();
            const now = new Date().toISOString().split('T')[0];
            const newId = `VKP${Date.now()}`;

            const dbRow = {
                ...toDbRow(product),
                id: newId,
                branch: user?.branch || 'Main',
                created_by: user?.username || 'System',
                created_at: now,
                updated_at: now
            };

            const { data, error } = await supabase
                .from('products')
                .insert(dbRow)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return data ? toProduct(data) : null;
        } catch (error: any) {
            console.error('Error adding product:', error);
            // Log specifically if it's a supabase error
            if (error.message) console.error('Supabase Error Details:', error.message);
            return null;
        }
    }

    async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
        try {
            const dbUpdates = {
                ...toDbRow(updates),
                updated_at: new Date().toISOString().split('T')[0]
            };

            const { data, error } = await supabase
                .from('products')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data ? toProduct(data) : null;
        } catch (error: any) {
            console.error('Error updating product:', error);
            if (error.message) console.error('Supabase Error Details:', error.message);
            return null;
        }
    }

    async deleteProduct(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            return !error;
        } catch (error: any) {
            console.error('Error deleting product:', error);
            if (error.message) console.error('Supabase Error Details:', error.message);
            return false;
        }
    }

    async updateStock(id: string, quantitySold: number): Promise<boolean> {
        try {
            const product = await this.getProductById(id);
            if (!product) return false;

            if (product.stock >= quantitySold) {
                const newStock = product.stock - quantitySold;

                const { error } = await supabase
                    .from('products')
                    .update({ stock: newStock, updated_at: new Date().toISOString().split('T')[0] })
                    .eq('id', id);

                return !error;
            }
            return false;
        } catch (error) {
            console.error('Error updating stock:', error);
            return false;
        }
    }
}

export const productService = new ProductService();
