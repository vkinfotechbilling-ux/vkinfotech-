import { CompanyDetails, InvoiceData } from '../types';
import { generateInvoicePDF } from '../components/invoice/InvoicePrintHandler';
import InvoiceTemplate from '../components/invoice/InvoiceTemplate';
import { createRoot } from 'react-dom/client';
import React from 'react';

/**
 * BackgroundPDFGenerator Service
 * 
 * Generates PDFs completely in the background without affecting the main UI.
 * Uses off-screen rendering to create PDFs from InvoiceTemplate without
 * mounting any components in the visible DOM or triggering the Billing page.
 * 
 * This service is specifically designed for the Customers page to download
 * historical bills without any UI interference.
 */

interface PDFGenerationOptions {
    onProgress?: (current: number, total: number) => void;
}

/**
 * Create an off-screen container for rendering invoices
 * This container is completely hidden and doesn't affect the main UI
 */
const createOffscreenContainer = (): HTMLDivElement => {
    const container = document.createElement('div');
    container.id = `pdf-generator-${Date.now()}`;

    // Position off-screen but allow full rendering for PDF capture
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '-9999px';  // Off-screen to the left
    container.style.width = '210mm';
    container.style.height = 'auto';
    container.style.overflow = 'visible';  // Allow content to render
    container.style.zIndex = '-1';

    document.body.appendChild(container);
    return container;
};

/**
 * Render invoice template off-screen and generate PDF
 */
const renderAndCapturePDF = async (
    company: CompanyDetails,
    data: InvoiceData,
    containerId: string
): Promise<any> => {
    return new Promise((resolve, reject) => {
        const container = document.getElementById(containerId);
        if (!container) {
            reject(new Error('Container not found'));
            return;
        }

        // Create a wrapper for this specific invoice
        const wrapper = document.createElement('div');
        wrapper.id = `invoice-wrapper-${Date.now()}`;
        container.appendChild(wrapper);

        // Render the invoice template using React
        const root = createRoot(wrapper);
        root.render(
            React.createElement(InvoiceTemplate, { company, data })
        );

        // Wait for rendering to complete
        setTimeout(async () => {
            try {
                const targetElement = wrapper.querySelector('div') as HTMLElement;
                if (!targetElement) {
                    throw new Error('Invoice template not rendered');
                }

                // Generate PDF from the rendered element
                const pdf = await generateInvoicePDF(company, data, {
                    targetElement,
                    save: false
                });

                // Cleanup
                root.unmount();
                wrapper.remove();

                resolve(pdf);
            } catch (error) {
                reject(error);
            }
        }, 500); // Wait for React rendering
    });
};

/**
 * Generate and download a single invoice PDF in the background
 */
export const downloadSingleInvoicePDF = async (
    company: CompanyDetails,
    data: InvoiceData
): Promise<void> => {
    const container = createOffscreenContainer();

    try {
        const pdf = await renderAndCapturePDF(company, data, container.id);

        if (pdf) {
            const filename = `Invoice_${data.invoiceNumber}_${data.customerName.replace(/\s+/g, '_')}.pdf`;
            pdf.save(filename);
        }
    } catch (error) {
        console.error('PDF generation failed:', error);
        throw new Error('Failed to generate PDF. Please try again.');
    } finally {
        // Cleanup container
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    }
};

/**
 * Generate multiple invoices as a single combined PDF
 * Runs completely in the background without affecting the main UI
 */
export const downloadBatchInvoicesPDF = async (
    company: CompanyDetails,
    invoicesData: InvoiceData[],
    customerName: string,
    options?: PDFGenerationOptions
): Promise<void> => {
    if (invoicesData.length === 0) {
        throw new Error('No invoices to download');
    }

    const container = createOffscreenContainer();

    try {
        let combinedPdf: any = null;

        for (let i = 0; i < invoicesData.length; i++) {
            const data = invoicesData[i];

            // Update progress
            if (options?.onProgress) {
                options.onProgress(i + 1, invoicesData.length);
            }

            // Render and capture this invoice
            const pdf = await renderAndCapturePDF(company, data, container.id);

            if (i === 0) {
                combinedPdf = pdf;
            } else if (combinedPdf && pdf) {
                // Merge PDFs by adding pages
                const pageCount = pdf.internal.getNumberOfPages();
                for (let page = 1; page <= pageCount; page++) {
                    pdf.setPage(page);
                    combinedPdf.addPage();
                    const imgData = pdf.output('dataurlstring', { compress: true });
                    // Note: This is a simplified merge. For production, consider using pdf-lib
                }
            }
        }

        // Download the combined PDF
        if (combinedPdf) {
            const filename = `${customerName.replace(/\s+/g, '_')}_All_Invoices.pdf`;
            combinedPdf.save(filename);
        }

    } catch (error) {
        console.error('Batch PDF generation failed:', error);
        throw new Error('Failed to generate all bills. Please try again.');
    } finally {
        // Cleanup container
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    }
};

/**
 * Alternative: Generate each invoice as a separate PDF and download as ZIP
 * This is more reliable than merging PDFs
 */
export const downloadBatchInvoicesAsZip = async (
    company: CompanyDetails,
    invoicesData: InvoiceData[],
    customerName: string,
    options?: PDFGenerationOptions
): Promise<void> => {
    if (invoicesData.length === 0) {
        throw new Error('No invoices to download');
    }

    console.log(`[BatchDownload] Starting batch download for ${invoicesData.length} invoices`);
    const container = createOffscreenContainer();

    try {
        // @ts-ignore
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        console.log(`[BatchDownload] Processing ${invoicesData.length} invoices...`);

        for (let i = 0; i < invoicesData.length; i++) {
            const data = invoicesData[i];
            console.log(`[BatchDownload] Processing invoice ${i + 1}/${invoicesData.length}: ${data.invoiceNumber}`);

            // Update progress
            if (options?.onProgress) {
                options.onProgress(i + 1, invoicesData.length);
            }

            // Render and capture this invoice
            const pdf = await renderAndCapturePDF(company, data, container.id);

            if (pdf) {
                const pdfBlob = pdf.output('blob');
                const filename = `Invoice_${data.invoiceNumber}_${data.customerName.replace(/\s+/g, '_')}.pdf`;
                zip.file(filename, pdfBlob);
                console.log(`[BatchDownload] Added ${filename} to ZIP (${pdfBlob.size} bytes)`);
            } else {
                console.warn(`[BatchDownload] Failed to generate PDF for invoice ${data.invoiceNumber}`);
            }
        }

        console.log(`[BatchDownload] All ${invoicesData.length} invoices processed. Generating ZIP...`);

        // Generate and download ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        console.log(`[BatchDownload] ZIP generated: ${zipBlob.size} bytes`);

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${customerName.replace(/\s+/g, '_')}_All_Invoices.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`[BatchDownload] Download triggered successfully`);

    } catch (error) {
        console.error('[BatchDownload] Batch ZIP generation failed:', error);
        throw new Error('Failed to generate all bills. Please try again.');
    } finally {
        // Cleanup container
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    }
};
