import html2pdf from 'html2pdf.js';
import { PriceOffer } from '@/types/price-offer';
import { createBrowserClient } from '@supabase/ssr';

const createPdfContent = (priceOffer: PriceOffer): string => {
  const itemsHtml = priceOffer.items.map(item => `
    <tr>
      <td style="text-align: right;">${item.description}</td>
      <td style="text-align: right;">${item.quantity}</td>
      <td style="text-align: right;">${item.currency === 'USD' ? '$' : '₪'}${item.unitPrice.toFixed(2)}</td>
      <td style="text-align: right;">${item.currency === 'USD' ? '$' : '₪'}${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
      <h1 style="text-align: center; color: #333;">הצעת מחיר</h1>
      
      <div style="margin-bottom: 20px;">
        <p>מספר הצעה: ${priceOffer.id}</p>
        <p>תאריך: ${new Date(priceOffer.date).toLocaleDateString('he-IL')}</p>
        <p>בתוקף עד: ${new Date(priceOffer.validUntil).toLocaleDateString('he-IL')}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #444;">פרטי לקוח</h2>
        <p>שם: ${priceOffer.customer.name}</p>
        <p>חברה: ${priceOffer.customer.company || 'לא צוין'}</p>
        <p>טלפון: ${priceOffer.customer.phone}</p>
        <p>אימייל: ${priceOffer.customer.email}</p>
        <p>כתובת: ${priceOffer.customer.address}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #444;">פריטים</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f4f4f4;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">תיאור</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">כמות</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">מחיר ליחידה</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">סה"כ</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 20px; text-align: left;">
        <p>סה"כ לפני מע"מ: ₪${priceOffer.subtotal.toFixed(2)}</p>
        <p>מע"מ (18%): ₪${priceOffer.tax.toFixed(2)}</p>
        <p style="font-weight: bold;">סה"כ כולל מע"מ: ₪${priceOffer.total.toFixed(2)}</p>
      </div>

      ${priceOffer.notes ? `
        <div style="margin-top: 30px;">
          <h2 style="color: #444;">הערות</h2>
          <p>${priceOffer.notes}</p>
        </div>
      ` : ''}
    </div>
  `;
};

export async function generatePDF(priceOffer: PriceOffer, userId: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    
    // Create the HTML content
    const content = createPdfContent(priceOffer);
    
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = content;
    document.body.appendChild(container);

    // PDF options
    const options = {
      margin: 10,
      filename: `price-offer-${priceOffer.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' as const
      }
    };

    try {
      // Generate PDF as Blob
      const pdfInstance = await html2pdf().from(container).set(options);
      const pdfBlob = await new Promise<Blob>((resolve, reject) => {
        pdfInstance.outputPdf('blob').then((result) => {
          if (result instanceof Blob) {
            resolve(result);
          } else {
            reject(new Error('Failed to generate PDF blob'));
          }
        }).catch(reject);
      });

      document.body.removeChild(container);

      // Update the file path to include userId for better organization
      const fileName = `${userId}/price-offers/${priceOffer.id}/${options.filename}`;
      
      // Upload with retry logic
      const { data: uploadData, error: uploadError } = await supabase.storage
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

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Create a record in the files table
      const { data: fileRecord, error: fileError } = await supabase
        .from('files')
        .insert({
          name: options.filename,
          file_path: fileName,
          file_type: 'application/pdf',
          size_bytes: pdfBlob.size,
          uploaded_by: userId,
          company_id: priceOffer.customer.company ? undefined : null
        })
        .select()
        .single();

      if (fileError) {
        throw fileError;
      }

      return {
        url: publicUrl,
        fileId: fileRecord.id
      };

    } catch (error) {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      throw error;
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

// Function to get a PDF by its ID
export const getPdfUrl = async (fileId: string): Promise<string | null> => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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