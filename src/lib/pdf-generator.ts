import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PriceOffer } from '@/types/price-offer';
import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfig } from '@/config/supabase';

// Add these types at the top of the file after the existing imports
type AutoTableStyles = {
  font: string;
  halign: string;
  fontSize: number;
  cellPadding: number;
  overflow: string;
  minCellHeight: number;
};

type AutoTableHeadStyles = {
  fillColor: number[];
  textColor: number[];
  fontStyle: string;
};

type AutoTableColumnStyles = {
  [key: number]: { cellWidth: number };
};

type AutoTableOptions = {
  head: string[][];
  body: string[][];
  startY: number;
  theme: string;
  styles: AutoTableStyles;
  headStyles: AutoTableHeadStyles;
  columnStyles: AutoTableColumnStyles;
};

interface AutoTableOutput {
  finalY: number;
}

// Extend jsPDF type to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: AutoTableOptions) => void;
  lastAutoTable: AutoTableOutput;
}

export async function generatePDF(priceOffer: PriceOffer, userId: string) {
  const supabase = createBrowserClient(
    supabaseConfig.url,
    supabaseConfig.anonKey
  );
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Failed to get auth session');
    }

    if (!session) {
      throw new Error('No active session found');
    }

    console.log('Starting PDF generation...');
    
    // Create new PDF document
    const doc = new jsPDF('p', 'mm', 'a4') as jsPDFWithAutoTable;
    
    // Set RTL mode and default styling
    doc.setR2L(true);
    doc.setFont("helvetica");
    doc.setFontSize(12);
    
    // Add header
    doc.setFontSize(24);
    doc.text('הצעת מחיר', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    
    // Add offer details
    doc.setFontSize(12);
    doc.text(`מספר הצעה: ${priceOffer.id}`, 190, 40, { align: 'right' });
    doc.text(`תאריך: ${new Date(priceOffer.date).toLocaleDateString('he-IL')}`, 190, 50, { align: 'right' });
    doc.text(`בתוקף עד: ${new Date(priceOffer.validUntil).toLocaleDateString('he-IL')}`, 190, 60, { align: 'right' });
    
    // Add customer details
    doc.setFontSize(16);
    doc.text('פרטי לקוח', 190, 80, { align: 'right' });
    doc.setFontSize(12);
    doc.text(`שם: ${priceOffer.customer.name}`, 190, 90, { align: 'right' });
    doc.text(`חברה: ${priceOffer.customer.company || 'לא צוין'}`, 190, 100, { align: 'right' });
    doc.text(`טלפון: ${priceOffer.customer.phone}`, 190, 110, { align: 'right' });
    doc.text(`אימייל: ${priceOffer.customer.email}`, 190, 120, { align: 'right' });
    doc.text(`כתובת: ${priceOffer.customer.address}`, 190, 130, { align: 'right' });
    
    // Add items table
    const tableHeaders = [['תיאור', 'כמות', 'מחיר ליחידה', 'סה"כ']];
    const tableData = priceOffer.items.map(item => [
      item.description,
      item.quantity.toString(),
      `${item.currency === 'USD' ? '$' : '₪'}${item.unitPrice.toFixed(2)}`,
      `${item.currency === 'USD' ? '$' : '₪'}${item.total.toFixed(2)}`
    ]);
    
    doc.autoTable({
      head: tableHeaders,
      body: tableData,
      startY: 150,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        halign: 'right',
        fontSize: 10,
        cellPadding: 5,
        overflow: 'linebreak',
        minCellHeight: 20
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 80 }, // Description
        1: { cellWidth: 30 }, // Quantity
        2: { cellWidth: 40 }, // Unit Price
        3: { cellWidth: 40 }  // Total
      }
    });
    
    // Add totals
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.text(`סה"כ לפני מע"מ: ₪${priceOffer.subtotal.toFixed(2)}`, 190, finalY, { align: 'right' });
    doc.text(`מע"מ (18%): ₪${priceOffer.tax.toFixed(2)}`, 190, finalY + 10, { align: 'right' });
    doc.text(`סה"כ כולל מע"מ: ₪${priceOffer.total.toFixed(2)}`, 190, finalY + 20, { align: 'right' });
    
    // Add notes if present
    if (priceOffer.notes) {
      doc.text('הערות:', 190, finalY + 40, { align: 'right' });
      const splitNotes = doc.splitTextToSize(priceOffer.notes, 180);
      doc.text(splitNotes, 190, finalY + 50, { align: 'right' });
    }
    
    // Generate PDF blob
    const pdfBlob = doc.output('blob');
    console.log('PDF blob created, size:', pdfBlob.size);

    // Upload to Supabase
    const fileName = `${userId}/price-offers/${priceOffer.id}/price-offer-${priceOffer.id}.pdf`;
    console.log('Uploading PDF to:', fileName);
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    console.log('PDF uploaded successfully');

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    console.log('Public URL generated:', publicUrl);

    // Create file record
    const { data: fileRecord, error: fileError } = await supabase
      .from('files')
      .insert({
        name: `price-offer-${priceOffer.id}.pdf`,
        file_path: fileName,
        file_type: 'application/pdf',
        size_bytes: pdfBlob.size,
        uploaded_by: userId,
        company_id: null
      })
      .select()
      .single();

    if (fileError) {
      console.error('File record error:', fileError);
      throw fileError;
    }

    console.log('File record created:', fileRecord);

    return {
      url: publicUrl,
      fileId: fileRecord.id
    };

  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

// Function to get a PDF by its ID
export const getPdfUrl = async (fileId: string): Promise<string | null> => {
  const supabase = createBrowserClient(
    supabaseConfig.url,
    supabaseConfig.anonKey
  );
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Authentication required');
    }

    const { data: fileRecord, error } = await supabase
      .from('files')
      .select('file_path')
      .eq('id', fileId)
      .single();

    if (error || !fileRecord) {
      throw error || new Error('File not found');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileRecord.file_path);

    return publicUrl;
  } catch (error) {
    console.error('Error getting PDF URL:', error);
    return null;
  }
};