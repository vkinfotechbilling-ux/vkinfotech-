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
const PORT = 5000;
const MONGO_URI = 'mongodb://localhost:27017/vkinfotech';

app.use(cors());
app.use(express.json());

// =====================
// MongoDB Connection
// =====================
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB: vkinfotech');
        console.log(`   Database: ${MONGO_URI}`);

        // Ensure requested default users exist
        const defaultUsers = [
            { id: 'VK INFOTECH', username: 'VK INFOTECH', password: 'VKINFOTECH123', role: 'admin', name: 'VK INFOTECH ADMIN' },
            { id: 'VK INFOTECHSTAFF', username: 'VK INFOTECHSTAFF', password: 'VKINFOTECHSTAFF123', role: 'staff', name: 'VK INFOTECH STAFF' }
        ];

        for (const userData of defaultUsers) {
            await User.findOneAndUpdate(
                { username: userData.username },
                userData,
                { upsert: true, new: true }
            );
        }
        console.log('✅ Custom default users synchronized');
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('   Make sure MongoDB is running on port 27017');
    });

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
app.listen(PORT, () => {
    console.log(`\n🚀 VK INFOTECH Server running on http://localhost:${PORT}`);
    console.log(`   API Health: http://localhost:${PORT}/api/health`);
    console.log(`   MongoDB: ${MONGO_URI}\n`);
});
