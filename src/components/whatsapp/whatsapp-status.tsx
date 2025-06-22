'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { MessageSquare, QrCode, Power, PowerOff, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface WhatsAppStatusProps {
  className?: string
}

export function WhatsAppStatus({ className }: WhatsAppStatusProps) {
  const [isConfigured, setIsConfigured] = useState(false)
  const [instanceId, setInstanceId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/instance')
      const result = await response.json()

      if (response.ok && result.success) {
        setIsConfigured(result.data.configured)
        setInstanceId(result.data.instanceID)
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (action: 'start' | 'stop' | 'qr') => {
    setActionLoading(action)

    try {
      const response = await fetch('/api/whatsapp/instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} instance`)
      }

      if (action === 'qr' && result.data?.qrCode) {
        // Show QR code in a dialog or new window
        const qrWindow = window.open('', '_blank', 'width=400,height=400')
        if (qrWindow) {
          qrWindow.document.write(`
            <html>
              <head><title>WhatsApp QR Code</title></head>
              <body style="margin:0;padding:20px;text-align:center;font-family:Arial,sans-serif;">
                <h2>סרוק את הקוד ב-WhatsApp</h2>
                <img src="${result.data.qrCode}" alt="WhatsApp QR Code" style="max-width:100%;height:auto;" />
                <p style="color:#666;font-size:14px;">סרוק קוד זה באפליקציית WhatsApp שלך</p>
              </body>
            </html>
          `)
        }
      }

      toast.success(result.message || `${action} completed successfully`)
    } catch (error) {
      console.error(`Error ${action} WhatsApp instance:`, error)
      toast.error(error instanceof Error ? error.message : `שגיאה ב-${action}`)
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">בודק סטטוס WhatsApp...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          WhatsApp Status
        </CardTitle>
        <CardDescription>
          נהל את החיבור שלך ל-WhatsApp Web
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>סטטוס תצורה:</span>
          <Badge variant={isConfigured ? 'default' : 'destructive'}>
            {isConfigured ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                מוגדר
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                לא מוגדר
              </>
            )}
          </Badge>
        </div>

        {isConfigured && (
          <div className="flex items-center justify-between">
            <span>Instance ID:</span>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {instanceId}
            </code>
          </div>
        )}

        {!isConfigured ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              נא להגדיר את משתני הסביבה WAPULSE_TOKEN ו-WAPULSE_INSTANCE_ID
            </p>
            <Button variant="outline" onClick={checkStatus}>
              בדוק שוב
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              onClick={() => handleAction('qr')}
              disabled={actionLoading !== null}
              className="justify-start"
            >
              {actionLoading === 'qr' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              הצג QR Code
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAction('start')}
              disabled={actionLoading !== null}
              className="justify-start"
            >
              {actionLoading === 'start' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Power className="mr-2 h-4 w-4" />
              )}
              התחל Instance
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAction('stop')}
              disabled={actionLoading !== null}
              className="justify-start"
            >
              {actionLoading === 'stop' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PowerOff className="mr-2 h-4 w-4" />
              )}
              עצור Instance
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 