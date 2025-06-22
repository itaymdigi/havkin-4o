'use client'

import { useState, useEffect } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { validatePhoneNumber } from '@/lib/whatsapp'
import { MessageSquare, FileText, Loader2, AlertCircle, Phone } from 'lucide-react'

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
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Update form when default values change
  useEffect(() => {
    setPhone(defaultPhone)
    setMessage(defaultMessage)
  }, [defaultPhone, defaultMessage])

  // Validate phone number on change
  useEffect(() => {
    if (phone.trim() && !validatePhoneNumber(phone)) {
      setPhoneError('מספר טלפון לא תקין. השתמש בפורמט: 972512345678')
    } else {
      setPhoneError(null)
    }
  }, [phone])

  const handleSend = async () => {
    setError(null)

    if (!phone.trim()) {
      setPhoneError('נא להזין מספר טלפון')
      return
    }

    if (!validatePhoneNumber(phone)) {
      setPhoneError('מספר טלפון לא תקין. השתמש בפורמט: 972512345678')
      return
    }

    if (!message.trim() && !priceOfferId) {
      setError('נא להזין הודעה')
      return
    }

    setIsLoading(true)

    try {
      let endpoint = '/api/whatsapp/send-message'
      let body: Record<string, unknown> = {
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
        throw new Error(result.error || result.message || 'שליחת ההודעה נכשלה')
      }

      toast.success('ההודעה נשלחה בהצלחה ב-WhatsApp!')
      
      // Reset form
      setPhone('')
      setMessage('')
      setIncludeFile(true)
      setError(null)
      setPhoneError(null)
      onOpenChange(false)

    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בשליחת ההודעה'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '') // Only allow digits
    setPhone(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <MessageSquare className="h-5 w-5 text-green-600" />
            שליחה ב-WhatsApp
          </DialogTitle>
          <DialogDescription className="text-right">
            {priceOfferId
              ? 'שלח הצעת מחיר ללקוח דרך WhatsApp'
              : 'שלח הודעה ללקוח דרך WhatsApp'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-3">
            <Label htmlFor="phone" className="text-right">מספר טלפון</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="972512345678"
                value={phone}
                onChange={handlePhoneChange}
                className={`pl-10 text-left font-mono ${phoneError ? 'border-destructive' : ''}`}
                dir="ltr"
                maxLength={15}
              />
            </div>
            {phoneError ? (
              <p className="text-sm text-destructive text-right">{phoneError}</p>
            ) : (
              <p className="text-xs text-muted-foreground text-right">
                הזן מספר טלפון עם קוד מדינה (ללא + או רווחים)
              </p>
            )}
          </div>

          <div className="grid gap-3">
            <Label htmlFor="message" className="text-right">הודעה</Label>
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
              className="resize-none"
              dir="rtl"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/1000 תווים
            </p>
          </div>

          {priceOfferId && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="grid gap-1 text-right">
                <Label htmlFor="include-file" className="text-sm font-medium">צרף קובץ PDF</Label>
                <p className="text-xs text-muted-foreground">
                  צרף את הצעת המחיר כקובץ PDF להודעה
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

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            ביטול
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading || !!phoneError || !phone.trim()}
            className="bg-green-600 hover:bg-green-700 flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <MessageSquare className="ml-2 h-4 w-4" />
                שלח
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 