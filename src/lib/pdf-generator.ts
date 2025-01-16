import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PriceOffer } from '@/types/price-offer';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
    lastAutoTable: { finalY: number };
  }
}

export const generatePDF = async (priceOffer: PriceOffer) => {
  try {
    console.log('Initializing PDF generation...');
    
    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
    });

    console.log('PDF document created');

    // Basic font setup
    doc.setFont('helvetica', 'normal');
    doc.setR2L(true);  // Enable RTL
    
    // Add header
    doc.setFontSize(24);
    doc.text('הצעת מחיר', 190, 20, { align: 'right' });

    // Add offer details
    doc.setFontSize(12);
    doc.text(`מספר הצעה: ${priceOffer.id}`, 190, 35, { align: 'right' });
    doc.text(`תאריך: ${new Date(priceOffer.date).toLocaleDateString('he-IL')}`, 190, 42, { align: 'right' });
    doc.text(`בתוקף עד: ${new Date(priceOffer.validUntil).toLocaleDateString('he-IL')}`, 190, 49, { align: 'right' });

    console.log('Added header and offer details');

    // Add customer details
    doc.setFontSize(16);
    doc.text('פרטי לקוח', 190, 65, { align: 'right' });
    doc.setFontSize(12);
    const customerDetails = [
      `שם: ${priceOffer.customer.name}`,
      `חברה: ${priceOffer.customer.company || 'לא צוין'}`,
      `טלפון: ${priceOffer.customer.phone}`,
      `אימייל: ${priceOffer.customer.email}`,
      `כתובת: ${priceOffer.customer.address}`,
    ];
    customerDetails.forEach((line, index) => {
      doc.text(line, 190, 75 + (index * 7), { align: 'right' });
    });

    console.log('Added customer details');

    // Add items table
    try {
      doc.autoTable({
        startY: 110,
        head: [['תיאור', 'כמות', 'מחיר ליחידה', 'סה"כ']],
        body: priceOffer.items.map(item => [
          item.description,
          item.quantity.toString(),
          `${item.currency === 'USD' ? '$' : '₪'}${item.unitPrice.toFixed(2)}`,
          `${item.currency === 'USD' ? '$' : '₪'}${item.total.toFixed(2)}`,
        ]),
        styles: {
          halign: 'right',
          font: 'helvetica',
          fontSize: 10,
        },
        headStyles: {
          fillColor: [51, 51, 51],
          textColor: [255, 255, 255],
          halign: 'right',
        },
        theme: 'grid',
      });

      console.log('Added items table');
    } catch (tableError) {
      console.error('Error creating table:', tableError);
      throw new Error('Failed to create items table');
    }

    // Add totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text('סיכום:', 190, finalY, { align: 'right' });
    doc.text(`סה"כ לפני מע"מ: ₪${priceOffer.subtotal.toFixed(2)}`, 190, finalY + 7, { align: 'right' });
    doc.text(`מע"מ (18%): ₪${priceOffer.tax.toFixed(2)}`, 190, finalY + 14, { align: 'right' });
    doc.text(`סה"כ כולל מע"מ: ₪${priceOffer.total.toFixed(2)}`, 190, finalY + 21, { align: 'right' });

    console.log('Added totals');

    // Add notes if any
    if (priceOffer.notes) {
      doc.text('הערות:', 190, finalY + 35, { align: 'right' });
      const notes = doc.splitTextToSize(priceOffer.notes, 180);
      notes.forEach((line: string, index: number) => {
        doc.text(line, 190, finalY + 42 + (index * 7), { align: 'right' });
      });
      console.log('Added notes');
    }

    // Save the PDF
    console.log('Saving PDF...');
    try {
      doc.save(`price-offer-${priceOffer.id}.pdf`);
      console.log('PDF saved successfully');
      return true;
    } catch (saveError) {
      console.error('Error saving PDF:', saveError);
      throw saveError;
    }
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw error;
  }
}; 