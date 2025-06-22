'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { PageHeader } from '@/components/ui/page-header'
import { WhatsAppStatus } from '@/components/whatsapp/whatsapp-status'
import { WhatsAppSendDialog } from '@/components/whatsapp/whatsapp-send-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { MessageSquare, FileText, Users, Settings, Send } from 'lucide-react'

export default function WhatsAppPage() {
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('שלום! זוהי הודעת בדיקה מ-CRM חבקין 👋')

  const handleQuickSend = () => {
    if (!testPhone.trim()) {
      toast.error('נא להזין מספר טלפון')
      return
    }
    setShowSendDialog(true)
  }

  const features = [
    {
      icon: MessageSquare,
      title: 'שליחת הודעות',
      description: 'שלח הודעות טקסט ללקוחות דרך WhatsApp',
      color: 'text-blue-600',
    },
    {
      icon: FileText,
      title: 'שליחת קבצים',
      description: 'שלח הצעות מחיר, חשבוניות ומסמכים כקבצי PDF',
      color: 'text-red-600',
    },
    {
      icon: Users,
      title: 'ניהול קבוצות',
      description: 'צור וניהל קבוצות WhatsApp ללקוחות',
      color: 'text-purple-600',
    },
    {
      icon: Settings,
      title: 'אוטומציה',
      description: 'הגדר תזכורות אוטומטיות ומעקב אחר לקוחות',
      color: 'text-orange-600',
    },
  ]

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6" dir="rtl">
        <PageHeader 
          title="WhatsApp Integration"
        />
        <p className="text-muted-foreground mb-6 text-right">נהל את החיבור שלך ל-WhatsApp ושלח הודעות ללקוחות</p>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* WhatsApp Status Card */}
          <div className="xl:col-span-1">
            <WhatsAppStatus />
          </div>

          {/* Features Overview */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">תכונות WhatsApp</CardTitle>
                <CardDescription className="text-right">
                  כל מה שאתה יכול לעשות עם WhatsApp Integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <feature.icon className={`h-6 w-6 ${feature.color} mt-1 flex-shrink-0`} />
                      <div className="text-right">
                        <h4 className="font-semibold">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Send Test */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <Send className="h-5 w-5 text-green-600" />
              שליחת הודעת בדיקה
            </CardTitle>
            <CardDescription className="text-right">
              שלח הודעת בדיקה כדי לוודא שהחיבור פועל כמו שצריך
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="test-phone" className="text-right">מספר טלפון</Label>
                <div className="relative">
                  <Input
                    id="test-phone"
                    placeholder="972512345678"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value.replace(/[^\d]/g, ''))}
                    className="text-left font-mono"
                    dir="ltr"
                    maxLength={15}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  הזן מספר טלפון עם קוד מדינה (ללא + או רווחים)
                </p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="test-message" className="text-right">הודעה</Label>
                <Textarea
                  id="test-message"
                  placeholder="הזן הודעת בדיקה..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                  dir="rtl"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {testMessage.length}/1000 תווים
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleQuickSend}
                className="bg-green-600 hover:bg-green-700"
                disabled={!testPhone.trim() || !testMessage.trim()}
              >
                <MessageSquare className="ml-2 h-4 w-4" />
                שלח הודעת בדיקה
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-right">הוראות שימוש</CardTitle>
            <CardDescription className="text-right">
              איך להתחיל לעבוד עם WhatsApp Integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="text-right">
                  <h4 className="font-semibold">הגדרת המשתנים</h4>
                  <p className="text-sm text-muted-foreground">
                    הגדר את WAPULSE_TOKEN ו-WAPULSE_INSTANCE_ID בקובץ .env.local
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div className="text-right">
                  <h4 className="font-semibold">סריקת QR Code</h4>
                  <p className="text-sm text-muted-foreground">
                    לחץ על &quot;הצג QR Code&quot; וסרוק את הקוד באפליקציית WhatsApp שלך
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div className="text-right">
                  <h4 className="font-semibold">התחלת השירות</h4>
                  <p className="text-sm text-muted-foreground">
                    לחץ על &quot;התחל Instance&quot; כדי להפעיל את השירות
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                  ✓
                </div>
                <div className="text-right">
                  <h4 className="font-semibold">התחל לשלוח הודעות</h4>
                  <p className="text-sm text-muted-foreground">
                    כעת תוכל לשלוח הודעות והצעות מחיר דרך WhatsApp מכל מקום במערכת
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Send Dialog */}
        <WhatsAppSendDialog
          open={showSendDialog}
          onOpenChange={setShowSendDialog}
          defaultPhone={testPhone}
          defaultMessage={testMessage}
        />
      </div>
    </DashboardLayout>
  )
} 