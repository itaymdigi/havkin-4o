import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { PriceOffer } from "@/types/price-offer";
import { DAVID_LIBRE_FONT_BASE64 } from "./fonts";

// Helper function to format currency
const formatCurrency = (amount: number, currency: string) => {
  return currency === "USD" ? `$${amount.toFixed(2)}` : `₪${amount.toFixed(2)}`;
};

// Function to load and add DavidLibre font to jsPDF
const addDavidLibreFont = (doc: jsPDF) => {
  try {
    // Add the embedded font to jsPDF
    doc.addFileToVFS("DavidLibre-Regular.ttf", DAVID_LIBRE_FONT_BASE64);
    doc.addFont("DavidLibre-Regular.ttf", "DavidLibre", "normal");

    // Verify the font was added successfully
    const _fontList = doc.getFontList();

    // Set the font
    doc.setFont("DavidLibre");

    return true;
  } catch (_error) {
    // Fallback to default font if DavidLibre fails to load
    doc.setFont("helvetica");
    return false;
  }
};

// Function to generate PDF from price offer data
export const generatePriceOfferPDF = (priceOffer: PriceOffer) => {
  try {
    // Create new PDF document
    const doc = new jsPDF("p", "mm", "a4");

    // Load and set Hebrew font
    const fontLoaded = addDavidLibreFont(doc);
    const fontName = fontLoaded ? "DavidLibre" : "helvetica";

    // Set RTL support
    doc.setR2L(true);
    doc.setLanguage("he");

    // Set initial position
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const rightEdge = pageWidth - margin;

    // Add header
    doc.setFontSize(24);
    doc.text("הצעת מחיר", rightEdge, 20, { align: "right" });

    // Add document details
    doc.setFontSize(12);
    const dateStr = new Date(priceOffer.date).toLocaleDateString("he-IL");
    const validUntilStr = new Date(priceOffer.validUntil).toLocaleDateString("he-IL");

    doc.text([`תאריך: ${dateStr}`, `בתוקף עד: ${validUntilStr}`], rightEdge, 35, {
      align: "right",
    });

    // Add customer details section
    doc.setFontSize(14);
    doc.text("פרטי לקוח", rightEdge, 55, { align: "right" });
    doc.setFontSize(12);

    const customerDetails = [
      `שם: ${priceOffer.customer.name}`,
      priceOffer.customer.company ? `חברה: ${priceOffer.customer.company}` : null,
      `טלפון: ${priceOffer.customer.phone}`,
      `אימייל: ${priceOffer.customer.email}`,
      `כתובת: ${priceOffer.customer.address}`,
    ].filter(Boolean) as string[];

    doc.text(customerDetails, rightEdge, 65, {
      align: "right",
      lineHeightFactor: 1.5,
    });

    // Add items table using autoTable
    const tableColumns = ['סה"כ', "מטבע", "מחיר ליחידה", "כמות", "תיאור פריט"];
    const tableRows = priceOffer.items.map((item) => [
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
      theme: "grid",
      styles: {
        font: fontName,
        fontSize: 10,
        cellPadding: 5,
        minCellHeight: 10,
        halign: "right",
        overflow: "linebreak",
        fontStyle: "normal",
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
        halign: "right",
        fontSize: 11,
        minCellHeight: 12,
        cellPadding: 5,
        font: fontName,
        fontStyle: "normal",
      },
      bodyStyles: {
        font: fontName,
        fontStyle: "normal",
        halign: "right",
      },
      columnStyles: {
        0: { cellWidth: 25, halign: "right", font: fontName }, // סה"כ
        1: { cellWidth: 20, halign: "center", font: fontName }, // מטבע
        2: { cellWidth: 25, halign: "right", font: fontName }, // מחיר ליחידה
        3: { cellWidth: 20, halign: "center", font: fontName }, // כמות
        4: { cellWidth: "auto", halign: "right", font: fontName }, // תיאור פריט
      },
      margin: { right: margin, left: margin },
      didDrawPage: () => {
        // Set font for each page
        doc.setFont(fontName);
      },
      didParseCell: (data) => {
        // Ensure correct font is used for all cells
        data.cell.styles.font = fontName;
        data.cell.styles.fontStyle = "normal";
      },
    });

    // Add totals section
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    doc.setFont(fontName);
    doc.setFontSize(12);

    const totalsText = [
      `סה"כ לפני מע"מ: ${formatCurrency(priceOffer.subtotal, "ILS")}`,
      `מע"מ (18%): ${formatCurrency(priceOffer.tax, "ILS")}`,
      `סה"כ כולל מע"מ: ${formatCurrency(priceOffer.total, "ILS")}`,
    ];

    doc.text(totalsText, rightEdge, finalY, {
      align: "right",
      lineHeightFactor: 1.5,
    });

    // Add notes if present
    if (priceOffer.notes?.trim()) {
      const notesY = finalY + 25;
      doc.setFontSize(14);
      doc.text("הערות:", rightEdge, notesY, { align: "right" });
      doc.setFontSize(12);
      doc.text(priceOffer.notes, rightEdge, notesY + 10, {
        align: "right",
        maxWidth: pageWidth - margin * 2,
      });
    }

    // Add footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(10);
    doc.text("תודה על שיתוף הפעולה", pageWidth / 2, footerY, { align: "center" });

    // Return the PDF as a blob URL
    const pdfBlob = doc.output("blob");
    return URL.createObjectURL(pdfBlob);
  } catch (_error) {
    throw new Error("Failed to generate PDF");
  }
};
