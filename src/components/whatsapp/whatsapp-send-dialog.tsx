'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { validatePhoneNumber } from '@/lib/whatsapp'
import { MessageSquare, FileText, Loader2 } from 'lucide-react'

interface WhatsAppSendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  priceOfferId?: string
  defaultPhone?: string
  defaultMessage?: string
}

export function WhatsAppSendDialog({
  open,
  onOpenChange,
  priceOfferId,
  defaultPhone = '',
  defaultMessage = '',
}: WhatsAppSendDialogProps) {
  const [phone, setPhone] = useState(defaultPhone)
  const [message, setMessage] = useState(defaultMessage)
  const [includeFile, setIncludeFile] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!phone.trim()) {
      toast.error('נא להזין מספר טלפון')
      return
    }

    if (!validatePhoneNumber(phone)) {
      toast.error('מספר טלפון לא תקין. השתמש בפורמט: 972512345678')
      return
    }

    if (!message.trim() && !priceOfferId) {
      toast.error('נא להזין הודעה')
      return
    }

    setIsLoading(true)

    try {
      let endpoint = '/api/whatsapp/send-message'
      let body: any = {
        to: phone,
        message,
        type: 'user',
      }

      // If sending a price offer, use the specialized endpoint
      if (priceOfferId) {
        endpoint = '/api/whatsapp/send-price-offer'
        body = {
          to: phone,
          priceOfferId,
          includeFile,
          ...(message.trim() && { customMessage: message }),
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'שליחת ההודעה נכשלה')
      }

      toast.success('ההודעה נשלחה בהצלחה ב-WhatsApp!')
      
      // Reset form
      setPhone('')
      setMessage('')
      setIncludeFile(true)
      onOpenChange(false)

    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      toast.error(error instanceof Error ? error.message : 'שגיאה בשליחת ההודעה')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            שליחה ב-WhatsApp
          </DialogTitle>
          <DialogDescription>
            {priceOfferId
              ? 'שלח הצעת מחיר ללקוח דרך WhatsApp'
              : 'שלח הודעה ללקוח דרך WhatsApp'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">מספר טלפון</Label>
            <Input
              id="phone"
              placeholder="972512345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              הזן מספר טלפון עם קוד מדינה (ללא + או רווחים)
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">הודעה</Label>
            <Textarea
              id="message"
              placeholder={
                priceOfferId
                  ? 'הודעה מותאמת אישית (אופציונלי - תיווצר הודעה אוטומטית אם לא תוזן)'
                  : 'הזן את ההודעה שלך כאן...'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          {priceOfferId && (
            <div className="flex items-center justify-between">
              <div className="grid gap-1">
                <Label htmlFor="include-file">צרף קובץ PDF</Label>
                <p className="text-xs text-muted-foreground">
                  צרף את הצעת המחיר כקובץ PDF
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-600" />
                <Switch
                  id="include-file"
                  checked={includeFile}
                  onCheckedChange={setIncludeFile}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            ביטול
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                שלח
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 