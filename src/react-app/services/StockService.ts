import { supabase } from '../lib/supabaseClient';
import { authService } from './AuthService';

export interface StockLog {
    id: string;
    productId: string;
    productName: string;
    oldStock: number;
    newStock: number;
    changeType: 'IN' | 'OUT';
    quantity: number;
    reason: string;
    remarks: string;
    updatedBy: string;
    dateTime: string;
    branch?: string;
}

// Helper to convert snake_case DB row to camelCase StockLog
function toStockLog(row: any): StockLog {
    return {
        id: row.id,
        productId: row.product_id,
        productName: row.product_name || '',
        oldStock: row.old_stock || 0,
        newStock: row.new_stock || 0,
        changeType: row.change_type,
        quantity: row.quantity,
        reason: row.reason || '',
        remarks: row.remarks || '',
        updatedBy: row.updated_by || '',
        dateTime: row.date_time || '',
        branch: row.branch
    };
}

class StockService {
    async getAllLogs(): Promise<StockLog[]> {
        try {
            const { data, error } = await supabase
                .from('stock_logs')
                .select('*')
                .order('date_time', { ascending: false });

            if (error) throw error;
            return (data || []).map(toStockLog);
        } catch (error) {
            console.error('Error fetching stock logs:', error);
            return [];
        }
    }

    async addLog(log: Omit<StockLog, 'id' | 'dateTime' | 'updatedBy' | 'branch'>): Promise<void> {
        try {
            const user = authService.getCurrentUser();
            const dbRow = {
                id: `L${Date.now()}`,
                product_id: log.productId,
                product_name: log.productName,
                old_stock: log.oldStock,
                new_stock: log.newStock,
                change_type: log.changeType,
                quantity: log.quantity,
                reason: log.reason,
                remarks: log.remarks,
                updated_by: user?.username || 'System',
                date_time: new Date().toLocaleString('en-IN'),
                branch: user?.branch || 'Main'
            };

            const { error } = await supabase
                .from('stock_logs')
                .insert(dbRow);

            if (error) throw error;
        } catch (error) {
            console.error('Error adding stock log:', error);
        }
    }

    async getLogsByProduct(productId: string): Promise<StockLog[]> {
        try {
            const { data, error } = await supabase
                .from('stock_logs')
                .select('*')
                .eq('product_id', productId)
                .order('date_time', { ascending: false });

            if (error) throw error;
            return (data || []).map(toStockLog);
        } catch (error) {
            console.error('Error fetching logs by product:', error);
            return [];
        }
    }
}

export const stockService = new StockService();
