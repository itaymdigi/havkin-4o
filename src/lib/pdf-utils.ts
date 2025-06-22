import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PriceOffer } from '@/types/price-offer';
import { DAVID_LIBRE_FONT_BASE64 } from './fonts';

// Helper function to format currency
const formatCurrency = (amount: number, currency: string) => {
  return currency === 'USD' ? `$${amount.toFixed(2)}` : `₪${amount.toFixed(2)}`;
};

// Function to load and add DavidLibre font to jsPDF
const addDavidLibreFont = (doc: jsPDF) => {
  try {
    // Add the embedded font to jsPDF
    doc.addFileToVFS('DavidLibre-Regular.ttf', DAVID_LIBRE_FONT_BASE64);
    doc.addFont('DavidLibre-Regular.ttf', 'DavidLibre', 'normal');
    doc.setFont('DavidLibre');
  } catch (error) {
    console.warn('Failed to load DavidLibre font, falling back to default:', error);
    // Fallback to default font if DavidLibre fails to load
    doc.setFont('helvetica');
  }
};

// Function to generate PDF from price offer data
export const generatePriceOfferPDF = (priceOffer: PriceOffer) => {
  try {
    // Create new PDF document
    const doc = new jsPDF('p', 'mm', 'a4');

    // Load and set Hebrew font
    addDavidLibreFont(doc);

    // Set RTL support
    doc.setR2L(true);
    doc.setLanguage("he");
    
    // Set initial position
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const rightEdge = pageWidth - margin;

    // Add header
    doc.setFontSize(24);
    doc.text('הצעת מחיר', rightEdge, 20, { align: 'right' });

    // Add document details
    doc.setFontSize(12);
    const dateStr = new Date(priceOffer.date).toLocaleDateString('he-IL');
    const validUntilStr = new Date(priceOffer.validUntil).toLocaleDateString('he-IL');
    
    doc.text([
      `תאריך: ${dateStr}`,
      `בתוקף עד: ${validUntilStr}`,
    ], rightEdge, 35, { align: 'right' });

    // Add customer details section
    doc.setFontSize(14);
    doc.text('פרטי לקוח', rightEdge, 55, { align: 'right' });
    doc.setFontSize(12);

    const customerDetails = [
      `שם: ${priceOffer.customer.name}`,
      priceOffer.customer.company ? `חברה: ${priceOffer.customer.company}` : null,
      `טלפון: ${priceOffer.customer.phone}`,
      `אימייל: ${priceOffer.customer.email}`,
      `כתובת: ${priceOffer.customer.address}`,
    ].filter(Boolean) as string[];

    doc.text(customerDetails, rightEdge, 65, {
      align: 'right', 
      lineHeightFactor: 1.5
    });

    // Add items table using autoTable
    const tableColumns = ['סה"כ', 'מטבע', 'מחיר ליחידה', 'כמות', 'תיאור פריט'];
    const tableRows = priceOffer.items.map(item => [
      formatCurrency(item.total, item.currency),
      item.currency,
      formatCurrency(item.unitPrice, item.currency),
      item.quantity.toString(),
      item.description,
    ]);

    autoTable(doc, {
      startY: 100,
      head: [tableColumns],
      body: tableRows,
      theme: 'grid',
      styles: {
        font: 'DavidLibre',
        fontSize: 10,
        cellPadding: 5,
        minCellHeight: 10,
        halign: 'right',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        halign: 'right',
        fontSize: 11,
        minCellHeight: 12,
        cellPadding: 5,
        font: 'DavidLibre',
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'right' }, // סה"כ
        1: { cellWidth: 20, halign: 'center' }, // מטבע
        2: { cellWidth: 25, halign: 'right' }, // מחיר ליחידה
        3: { cellWidth: 20, halign: 'center' }, // כמות
        4: { cellWidth: 'auto', halign: 'right' }, // תיאור פריט
      },
      margin: { right: margin, left: margin },
      didDrawPage: function (data) {
        // Set font for each page
        doc.setFont('DavidLibre');
      }
    });

    // Add totals section
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    doc.setFont('DavidLibre');
    doc.setFontSize(12);
    
    const totalsText = [
      `סה"כ לפני מע"מ: ${formatCurrency(priceOffer.subtotal, 'ILS')}`,
      `מע"מ (18%): ${formatCurrency(priceOffer.tax, 'ILS')}`,
      `סה"כ כולל מע"מ: ${formatCurrency(priceOffer.total, 'ILS')}`,
    ];
    
    doc.text(totalsText, rightEdge, finalY, {
      align: 'right',
      lineHeightFactor: 1.5
    });

    // Add notes if present
    if (priceOffer.notes && priceOffer.notes.trim()) {
      const notesY = finalY + 25;
      doc.setFontSize(14);
      doc.text('הערות:', rightEdge, notesY, { align: 'right' });
      doc.setFontSize(12);
      doc.text(priceOffer.notes, rightEdge, notesY + 10, {
        align: 'right',
        maxWidth: pageWidth - (margin * 2),
      });
    }

    // Add footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(10);
    doc.text('תודה על שיתוף הפעולה', pageWidth / 2, footerY, { align: 'center' });

    // Return the PDF as a blob URL
    const pdfBlob = doc.output('blob');
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}; 