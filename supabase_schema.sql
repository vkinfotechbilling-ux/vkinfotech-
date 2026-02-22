-- =============================================
-- VK INFO TECH - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    name TEXT NOT NULL,
    branch TEXT NOT NULL DEFAULT 'Main'
);

-- Seed default users
INSERT INTO users (id, username, password, role, name, branch) VALUES
    ('VKINFOTECH', 'VKINFOTECH', 'VKINFOTECH123', 'admin', 'VK INFOTECH ADMIN', 'Main'),
    ('VKINFOTECHSTAFF', 'VKINFOTECHSTAFF', 'VKINFOTECHSTAFF123', 'staff', 'VK INFOTECH STAFF', 'Main')
ON CONFLICT (id) DO NOTHING;

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT DEFAULT '',
    email TEXT DEFAULT '',
    gstin TEXT DEFAULT '',
    customer_type TEXT DEFAULT 'Retail' CHECK (customer_type IN ('Retail', 'Wholesale')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    total_purchases NUMERIC DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    last_purchase_date TEXT DEFAULT '',
    created_at TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
    updated_at TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
    branch TEXT NOT NULL DEFAULT 'Main',
    created_by TEXT DEFAULT 'System'
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT DEFAULT '',
    category TEXT DEFAULT '',
    description TEXT DEFAULT '',
    price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    serial_number TEXT DEFAULT '',
    warranty TEXT DEFAULT '',
    model TEXT DEFAULT '',
    gst_rate NUMERIC DEFAULT 0,
    hsn_code TEXT DEFAULT '',
    created_at TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
    updated_at TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
    branch TEXT NOT NULL DEFAULT 'Main',
    created_by TEXT DEFAULT 'System'
);

-- 4. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    customer_id TEXT DEFAULT '',
    customer_name TEXT DEFAULT '',
    customer_phone TEXT DEFAULT '',
    customer_address TEXT DEFAULT '',
    date TEXT NOT NULL,
    time TEXT DEFAULT '',
    amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    payment_mode TEXT DEFAULT 'Cash',
    due_date TEXT DEFAULT '',
    products JSONB DEFAULT '[]'::jsonb,
    branch TEXT NOT NULL DEFAULT 'Main',
    created_by TEXT DEFAULT 'System'
);

-- 5. Stock Logs Table
CREATE TABLE IF NOT EXISTS stock_logs (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT DEFAULT '',
    old_stock INTEGER DEFAULT 0,
    new_stock INTEGER DEFAULT 0,
    change_type TEXT NOT NULL CHECK (change_type IN ('IN', 'OUT')),
    quantity INTEGER NOT NULL,
    reason TEXT DEFAULT '',
    remarks TEXT DEFAULT '',
    updated_by TEXT DEFAULT '',
    date_time TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
    branch TEXT NOT NULL DEFAULT 'Main'
);

-- =============================================
-- Row Level Security (RLS)
-- Using permissive policies for anon key access
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated/anon users
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on stock_logs" ON stock_logs FOR ALL USING (true) WITH CHECK (true);
