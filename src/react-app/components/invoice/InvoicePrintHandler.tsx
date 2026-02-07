import { CompanyDetails, InvoiceData } from '../../types';

/**
 * Prepares a wrapper containing cloned visible invoice pages for printing or PDF.
 * Strategy: Capture the ALREADY RENDERED React output to ensure WYSIWYG fidelity.
 */
const prepareVisibleInvoiceDOM = (): HTMLElement => {
    // 1. Find the main anchor element (Page 1)
    const originalInvoice = document.getElementById('invoice');
    if (!originalInvoice) throw new Error('Invoice visible template (#invoice) not found in DOM');

    const wrapper = document.createElement('div');
    wrapper.className = 'invoice-print-wrapper';
    wrapper.style.width = '210mm';
    wrapper.style.margin = '0 auto';

    // 2. Identify all invoice pages
    // Since React renders sibling divs for pages, we look at the parent or siblings
    const parentCtx = originalInvoice.parentElement;
    let pages: Element[] = [];

    if (parentCtx) {
        // robustly select all invoice page blocks
        const allCandidates = parentCtx.querySelectorAll('div[id^="invoice"]');
        if (allCandidates.length > 0) {
            pages = Array.from(allCandidates);
        } else {
            pages = [originalInvoice];
        }
    } else {
        pages = [originalInvoice];
    }

    // 3. Clone and Sanitize
    pages.forEach((page, index) => {
        const pageClone = page.cloneNode(true) as HTMLElement;

        // Ensure Strict CSS Visibility for the clone
        pageClone.style.display = 'block';
        pageClone.style.visibility = 'visible';
        pageClone.style.opacity = '1';
        pageClone.style.transform = 'none';
        pageClone.style.overflow = 'visible';

        // Ensure background is white
        pageClone.style.backgroundColor = '#ffffff';

        // Add Page Break
        if (index < pages.length - 1) {
            // margin for visual separation in preview, but meaningless for canvas capture of individual pages
            pageClone.style.marginBottom = '20px';
        }

        // Clean up interactive elements (Buttons, Icons)
        // Remove buttons and elements marked to be hidden in print
        const buttons = pageClone.querySelectorAll('button, [role="button"], .print\\:hidden');
        buttons.forEach(el => el.remove());

        // Convert Inputs/Selects/Textareas to Static Text
        pageClone.querySelectorAll('input, select, textarea').forEach(el => {
            let val = '';
            // Try to find the live element by ID for hydration
            if (el.id) {
                const liveEl = document.getElementById(el.id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
                if (liveEl) val = liveEl.value;
            } else {
                val = (el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
            }

            const span = document.createElement('span');
            span.textContent = val;
            span.style.whiteSpace = 'pre-wrap'; // Preserve formatting for textareas
            if (val) span.style.color = '#000000'; // Ensure visibility

            // basic styling copy
            span.style.fontFamily = 'inherit';
            span.style.fontWeight = 'bold';

            el.parentElement?.replaceChild(span, el);
        });

        wrapper.appendChild(pageClone);
    });

    return wrapper;
};

export const handlePrintInvoice = (_company: CompanyDetails, _data: InvoiceData) => {
    window.print();
};

export const generateInvoicePDF = async (_company: CompanyDetails, data: InvoiceData) => {
    // Import dependencies directly
    // @ts-ignore
    const html2canvas = (await import('html2canvas')).default;
    // @ts-ignore
    const { jsPDF } = await import('jspdf');

    let pagedDOM: HTMLElement;
    try {
        pagedDOM = prepareVisibleInvoiceDOM();
    } catch (e) {
        alert("Could not prepare invoice for PDF: " + e);
        return;
    }

    const container = document.createElement('div');
    container.id = 'invoice-pdf-capture-stage';

    // Position visible but safe
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.zIndex = '9999';
    container.style.backgroundColor = '#f0f0f0'; // Gray back to distinguish pages
    container.style.width = '210mm';
    container.style.padding = '0';
    container.style.margin = '0';

    document.body.appendChild(container);
    container.appendChild(pagedDOM);

    try {
        // Wait for images
        const images = Array.from(container.querySelectorAll('img'));
        await Promise.all(images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
        }));
        // Safety delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 210;

        // Select the cloned pages
        // Note: prepareVisibleInvoiceDOM appends page clones directly to wrapper
        const pages = Array.from(pagedDOM.children) as HTMLElement[];

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];

            // Capture the page
            const canvas = await html2canvas(page, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                scrollX: 0,
                scrollY: 0
            });

            const imgData = canvas.toDataURL('image/png');
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        }

        pdf.save(`${data.customerName ? data.customerName.trim() : `Invoice_${data.invoiceNumber}`}.pdf`);

    } catch (error) {
        console.error("PDF Generation Error:", error);
        alert("Failed to generate PDF. Check console.");
    } finally {
        document.body.removeChild(container);
    }
};
