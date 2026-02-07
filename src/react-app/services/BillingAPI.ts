import { InvoiceData } from '../../types';

const API_BASE_URL = 'http://localhost:5000/api';

export const BillingAPI = {
    generateWordInvoice: async (data: InvoiceData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/generate-invoice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to generate invoice');
            }

            // Handle file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice_${data.invoiceNumber || 'New'}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return true;
        } catch (error) {
            console.error('Error generating Word invoice:', error);
            throw error;
        }
    }
};
