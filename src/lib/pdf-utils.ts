import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PriceOffer } from '@/types/price-offer';

// Helper function to format currency
const formatCurrency = (amount: number, currency: string) => {
  return currency === 'USD' ? `$${amount.toFixed(2)}` : `₪${amount.toFixed(2)}`;
};

// Function to encode Hebrew text
const encodeHebrew = (text: string) => {
  const hebrewMap: { [key: string]: string } = {
    'א': 'א', 'ב': 'ב', 'ג': 'ג', 'ד': 'ד', 'ה': 'ה', 'ו': 'ו', 'ז': 'ז', 'ח': 'ח', 'ט': 'ט',
    'י': 'י', 'כ': 'כ', 'ל': 'ל', 'מ': 'מ', 'נ': 'נ', 'ס': 'ס', 'ע': 'ע', 'פ': 'פ', 'צ': 'צ',
    'ק': 'ק', 'ר': 'ר', 'ש': 'ש', 'ת': 'ת', 'ך': 'ך', 'ם': 'ם', 'ן': 'ן', 'ף': 'ף', 'ץ': 'ץ',
    ' ': ' ', ':': ':', '₪': '₪', '$': '$', '.': '.', ',': ',', '(': '(', ')': ')', '%': '%',
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    '@': '@', '-': '-', '_': '_', '/': '/', '\\': '\\', '"': '"', "'": "'",
  };

  return text.split('').map(char => hebrewMap[char] || char).join('');
};

// Function to generate PDF from price offer data
export const generatePriceOfferPDF = (priceOffer: PriceOffer) => {
  try {
    // Create new PDF document
    const doc = new jsPDF('p', 'mm', 'a4');

    // Set up document
    doc.setR2L(true);
    doc.setLanguage("he");
    
    // Set initial position
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const rightEdge = pageWidth - margin;

    // Add header
    doc.setFontSize(24);
    doc.text(encodeHebrew('הצעת מחיר'), rightEdge, 20, { align: 'right' });

    // Add document details
    doc.setFontSize(12);
    const dateStr = new Date(priceOffer.date).toLocaleDateString('he-IL');
    const validUntilStr = new Date(priceOffer.validUntil).toLocaleDateString('he-IL');
    
    doc.text([
      encodeHebrew(`תאריך: ${dateStr}`),
      encodeHebrew(`בתוקף עד: ${validUntilStr}`),
    ], rightEdge, 35, { align: 'right' });

    // Add customer details section
    doc.setFontSize(14);
    doc.text(encodeHebrew('פרטי לקוח'), rightEdge, 55, { align: 'right' });
    doc.setFontSize(12);

    const customerDetails = [
      encodeHebrew(`שם: ${priceOffer.customer.name}`),
      priceOffer.customer.company ? encodeHebrew(`חברה: ${priceOffer.customer.company}`) : null,
      encodeHebrew(`טלפון: ${priceOffer.customer.phone}`),
      encodeHebrew(`אימייל: ${priceOffer.customer.email}`),
      encodeHebrew(`כתובת: ${priceOffer.customer.address}`),
    ] as string[];

    doc.text(customerDetails.filter(Boolean) as string[], rightEdge, 65, {
      align: 'right', 
      lineHeightFactor: 1.5
    });

    // Add items table using autoTable function
    const tableColumns = ['סה"כ', 'מטבע', 'מחיר ליחידה', 'כמות', 'תיאור פריט'].map(encodeHebrew);
    const tableRows = priceOffer.items.map(item => [
      formatCurrency(item.total, item.currency),
      item.currency,
      formatCurrency(item.unitPrice, item.currency),
      item.quantity.toString(),
      encodeHebrew(item.description),
    ]);

    autoTable(doc, {
      startY: 100,
      head: [tableColumns],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        halign: 'right',
        fontSize: 11,
        minCellHeight: 10,
        cellPadding: 5
      },
      styles: {
        halign: 'right',
        fontSize: 10,
        cellPadding: 5,
        minCellHeight: 10
      },
      columnStyles: {
        0: { cellWidth: 25 }, // סה"כ
        1: { cellWidth: 20 }, // מטבע
        2: { cellWidth: 25 }, // מחיר ליחידה
        3: { cellWidth: 20 }, // כמות
        4: { cellWidth: 'auto' }, // תיאור פריט
      },
      margin: { right: margin, left: margin }
    });

    // Add totals section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text([
      encodeHebrew(`סה"כ לפני מע"מ: ${formatCurrency(priceOffer.subtotal, 'ILS')}`),
      encodeHebrew(`מע"מ (18%): ${formatCurrency(priceOffer.tax, 'ILS')}`),
      encodeHebrew(`סה"כ כולל מע"מ: ${formatCurrency(priceOffer.total, 'ILS')}`),
    ], rightEdge, finalY, {
      align: 'right',
      lineHeightFactor: 1.5
    });

    // Add notes if present
    if (priceOffer.notes && priceOffer.notes.trim()) {
      const notesY = finalY + 30;
      doc.setFontSize(14);
      doc.text(encodeHebrew('הערות:'), rightEdge, notesY, { align: 'right' });
      doc.setFontSize(12);
      doc.text(encodeHebrew(priceOffer.notes), rightEdge, notesY + 10, {
        align: 'right',
        maxWidth: pageWidth - (margin * 2),
      });
    }

    // Add footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(10);
    doc.text(encodeHebrew('תודה על שיתוף הפעולה'), pageWidth / 2, footerY, { align: 'center' });

    // Return the PDF as a blob URL
    const pdfBlob = doc.output('blob');
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}; 