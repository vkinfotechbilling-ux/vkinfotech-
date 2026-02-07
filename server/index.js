const express = require('express');
const cors = require('cors');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Ensure templates directory exists
const TEMPLATE_DIR = path.join(__dirname, 'templates');
if (!fs.existsSync(TEMPLATE_DIR)) {
    console.error("Template directory not found!");
}

app.post('/api/generate-invoice', (req, res) => {
    try {
        console.log("Received invoice generation request...");
        const data = req.body;

        // Load the template
        // Note: Using the file we copied. Ensure the name matches.
        const content = fs.readFileSync(path.resolve(TEMPLATE_DIR, 'ETS System Bill.docx'), 'binary');

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Map frontend data to template data if necessary
        // Frontend uses 'products', Template requested 'items' or 'products' loop.
        // We will pass 'data' directly but ensure 'products' is aliased to 'items' just in case.
        const templateData = {
            ...data,
            items: data.products, // Alias for flexibility

            // Ensure simple scalars for easy mapping
            invoice_no: data.invoiceNumber,
            customer_name: data.customerName,
            address: data.customerAddress,
            // 'date' is already in data.date
            // 'total' might differ from 'subTotal', mapping explicit keys:
            total: data.subTotal, // Assuming 'total' means subtotal in this context or grand total? 
            // User said {{grand_total}} separately, so {{total}} is likely subtotal or total before tax.
            tax: data.sgst + data.cgst, // Simplified tax total if needed
            grand_total: data.grandTotal,

            // Amount in words
            amount_in_words: data.amountInWords
        };

        // Render the document
        doc.render(templateData);

        // --- DATABASE SAVE (Simple JSON) ---
        const DB_DIR = path.join(__dirname, 'db');
        if (!fs.existsSync(DB_DIR)) {
            fs.mkdirSync(DB_DIR);
        }
        const DB_FILE = path.join(DB_DIR, 'invoices.json');

        // Read existing
        let invoices = [];
        if (fs.existsSync(DB_FILE)) {
            try {
                invoices = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            } catch (e) {
                console.error("Error reading DB:", e);
                invoices = [];
            }
        }

        // Add new
        const newInvoice = {
            id: data.invoiceNumber, // Use invoice number as ID or generate UUID
            timestamp: new Date().toISOString(),
            customer: data.customerName,
            amount: data.grandTotal,
            ...data // Store full data for history
        };
        invoices.push(newInvoice);

        // Write back
        fs.writeFileSync(DB_FILE, JSON.stringify(invoices, null, 2));
        console.log(`Invoice ${data.invoiceNumber} saved to database.`);

        // Get the zip document and generate it as a nodebuffer
        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            // compression: DEFLATE adds a compression step.
            // For a 50MB output document, expect 500ms additional CPU time
            compression: 'DEFLATE',
        });

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${data.invoiceNumber || 'Draft'}.docx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        res.send(buf);
        console.log("Invoice generated and sent successfully.");

    } catch (error) {
        console.error("Error generating invoice:", error);
        res.status(500).json({ error: 'Failed to generate invoice', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
