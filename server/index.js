const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

// Import routes
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const stockLogRoutes = require('./routes/stockLogRoutes');
const authRoutes = require('./routes/authRoutes');

// Import User model for seeding
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vkinfotech';

const helmet = require('helmet');
const compression = require('compression');

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.originalUrl} - Origin: ${req.get('Origin')} - IP: ${req.ip}`);
    next();
});

// =====================
// MongoDB Connection
// =====================
// =====================
// MongoDB Connection (Serverless Optimized)
// =====================
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        console.log('✅ Using cached MongoDB connection');
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            autoIndex: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4 // Use IPv4
        };

        console.log('🔄 Creating new MongoDB connection...');
        cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
            console.log('✅ Connected to MongoDB: vkinfotech');
            // Check if default users needed seeding, but only once
            seedDefaultUsers();
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('❌ MongoDB connection error:', e);
        throw e;
    }

    return cached.conn;
};

const seedDefaultUsers = async () => {
    try {
        const defaultUsers = [
            { id: 'VKINFOTECH', username: 'VKINFOTECH', password: 'VKINFOTECH123', role: 'admin', name: 'VK INFOTECH ADMIN' },
            { id: 'VKINFOTECHSTAFF', username: 'VKINFOTECHSTAFF', password: 'VKINFOTECHSTAFF123', role: 'staff', name: 'VK INFOTECH STAFF' }
        ];

        for (const userData of defaultUsers) {
            await User.findOneAndUpdate(
                { username: userData.username },
                userData,
                { upsert: true, new: true }
            );
        }
        console.log('✅ Custom default users synchronized');
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
    }
};

// Event Listeners for Stability
mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
    mongoose.connection.lastError = err;
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

// Heartbeat Log (Every 60 seconds)
setInterval(() => {
    if (mongoose.connection.readyState === 1) {
        console.log(`[${new Date().toLocaleTimeString()}] ✅ DB Heartbeat: Connected`);
    } else {
        console.warn(`[${new Date().toLocaleTimeString()}] ⚠️ DB Heartbeat: Disconnected`);
    }
}, 60000);

// connectDB();

// =====================
// API Routes
// =====================
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/stock-logs', stockLogRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        lastError: mongoose.connection.lastError ? mongoose.connection.lastError.message : null,
        timestamp: new Date().toISOString()
    });
});

// =====================
// Invoice Generation (Existing)
// =====================
const TEMPLATE_DIR = path.join(__dirname, 'templates');
if (!fs.existsSync(TEMPLATE_DIR)) {
    console.warn("⚠️  Template directory not found!");
}

app.post('/api/generate-invoice', (req, res) => {
    try {
        console.log("Received invoice generation request...");
        const data = req.body;

        const content = fs.readFileSync(path.resolve(TEMPLATE_DIR, 'ETS System Bill.docx'), 'binary');

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        const templateData = {
            ...data,
            items: data.products,
            invoice_no: data.invoiceNumber,
            customer_name: data.customerName,
            address: data.customerAddress,
            total: data.subTotal,
            tax: data.sgst + data.cgst,
            grand_total: data.grandTotal,
            amount_in_words: data.amountInWords
        };

        doc.render(templateData);

        // --- DATABASE SAVE (MongoDB) ---
        const Invoice = require('./models/Invoice');
        const newInvoice = new Invoice({
            id: data.invoiceNumber,
            invoiceNumber: data.invoiceNumber,
            customerName: data.customerName,
            date: data.date || new Date().toISOString().split('T')[0],
            amount: data.grandTotal,
            paidAmount: data.paidAmount || data.grandTotal,
            balance: data.balance || 0,
            paymentMode: data.paymentMode || 'Cash',
            products: data.products || []
        });
        newInvoice.save().catch(err => console.error('Invoice DB save error:', err.message));
        console.log(`Invoice ${data.invoiceNumber} saved to MongoDB.`);

        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${data.invoiceNumber || 'Draft'}.docx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        res.send(buf);
        console.log("Invoice generated and sent successfully.");

    } catch (error) {
        console.error("Error generating invoice:", error);
        res.status(500).json({ error: 'Failed to generate invoice', details: error.message });
    }
});

// =====================
// Start Server
// =====================
// =====================
// Start Server
// =====================
// =====================
// Start Server
// =====================
if (require.main === module) {
    connectDB();
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🚀 VK INFOTECH Server running on port ${PORT}`);
        console.log(`   Address: http://0.0.0.0:${PORT}`);
        console.log(`   API Health: http://0.0.0.0:${PORT}/api/health`);
        console.log(`   MongoDB URI: ${MONGO_URI.replace(/:([^:@]+)@/, ':****@')}`); // Hide password in logs
    });
}

module.exports = { app, connectDB };
