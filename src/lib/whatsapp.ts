import { PriceOffer } from '@/types'

export interface WhatsAppContact {
  phone: string
  name?: string
}

export interface WhatsAppMessage {
  to: string
  message: string
  type?: 'user' | 'group'
}

export interface WhatsAppFile {
  to: string
  file: string // base64 encoded with data URI prefix
  filename: string
  caption?: string
}

export interface WhatsAppGroup {
  name: string
  participants: string[]
}

/**
 * Validates phone number format for WhatsApp
 * Expected format: country code + number (no + or spaces)
 * Example: 972512345678
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove any spaces, dashes, or plus signs
  const cleanPhone = phone.replace(/[\s\-\+]/g, '')
  
  // Check if it's a valid format (1-4 digit country code + 6-15 digit number)
  const phoneRegex = /^\d{1,4}\d{6,15}$/
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 7 && cleanPhone.length <= 19
}

/**
 * Formats phone number for WhatsApp API
 * Removes spaces, dashes, and plus signs
 */
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\+]/g, '')
}

/**
 * Generates WhatsApp message for price offer
 */
export function generatePriceOfferMessage(priceOffer: PriceOffer): string {
  const message = `
🧾 *הצעת מחיר חדשה*

📋 *מספר הצעה:* ${priceOffer.offer_number}
📅 *תאריך:* ${new Date(priceOffer.created_at).toLocaleDateString('he-IL')}

👤 *פרטי לקוח:*
• שם: ${priceOffer.customer_name || 'לא צוין'}
• טלפון: ${priceOffer.customer_phone || 'לא צוין'}
• אימייל: ${priceOffer.customer_email || 'לא צוין'}
${priceOffer.customer_company ? `• חברה: ${priceOffer.customer_company}` : ''}
${priceOffer.customer_address ? `• כתובת: ${priceOffer.customer_address}` : ''}

💰 *סיכום כספי:*
• סה"כ לפני מע"ם: ₪${priceOffer.subtotal?.toLocaleString('he-IL') || '0'}
• מע"ם (${priceOffer.tax_rate || 17}%): ₪${priceOffer.tax_amount?.toLocaleString('he-IL') || '0'}
• *סה"כ כולל מע"ם: ₪${priceOffer.total?.toLocaleString('he-IL') || '0'}*

📝 *הערות:*
${priceOffer.notes || 'אין הערות נוספות'}

---
נשלח מ-CRM חבקין
  `.trim()

  return message
}

/**
 * Generates WhatsApp message for appointment reminder
 */
export function generateAppointmentReminderMessage(
  customerName: string,
  appointmentDate: Date,
  appointmentDetails?: string
): string {
  const message = `
🗓️ *תזכורת לפגישה*

שלום ${customerName},

זוהי תזכורת לפגישה שלנו:
📅 תאריך: ${appointmentDate.toLocaleDateString('he-IL')}
🕐 שעה: ${appointmentDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}

${appointmentDetails ? `📝 פרטים: ${appointmentDetails}` : ''}

אנא אשרו הגעתכם או הודיעו על שינוי במידת הצורך.

תודה,
צוות חבקין
  `.trim()

  return message
}

/**
 * Generates WhatsApp message for follow-up
 */
export function generateFollowUpMessage(customerName: string, context?: string): string {
  const message = `
👋 שלום ${customerName},

אני נוצר קשר במסגרת המעקב שלנו.

${context ? `${context}\n\n` : ''}

אשמח לשמוע ממך ולעזור בכל שאלה או צורך נוסף.

בברכה,
צוות חבקין
  `.trim()

  return message
}

/**
 * Converts file to base64 data URI
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Gets WhatsApp chat ID format
 * For users: phone@c.us
 * For groups: groupid@g.us
 */
export function getChatId(phone: string, type: 'user' | 'group' = 'user'): string {
  const formattedPhone = formatPhoneNumber(phone)
  return type === 'user' ? `${formattedPhone}@c.us` : `${formattedPhone}@g.us`
} 