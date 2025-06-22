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
          description="נהל את החיבור שלך ל-WhatsApp ושלח הודעות ללקוחות"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* WhatsApp Status Card */}
          <div className="lg:col-span-1">
            <WhatsAppStatus />
          </div>

          {/* Features Overview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>תכונות WhatsApp</CardTitle>
                <CardDescription>
                  כל מה שאתה יכול לעשות עם WhatsApp Integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      <feature.icon className={`h-6 w-6 ${feature.color} mt-1`} />
                      <div>
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
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" />
              שליחת הודעת בדיקה
            </CardTitle>
            <CardDescription>
              שלח הודעת בדיקה כדי לוודא שהחיבור פועל כמו שצריך
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-phone">מספר טלפון</Label>
                <Input
                  id="test-phone"
                  placeholder="972512345678"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">
                  הזן מספר טלפון עם קוד מדינה (ללא + או רווחים)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-message">הודעה</Label>
                <Textarea
                  id="test-message"
                  placeholder="הזן הודעת בדיקה..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleQuickSend}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                שלח הודעת בדיקה
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>הוראות שימוש</CardTitle>
            <CardDescription>
              איך להתחיל לעבוד עם WhatsApp Integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">הגדרת המשתנים</h4>
                  <p className="text-sm text-muted-foreground">
                    הגדר את WAPULSE_TOKEN ו-WAPULSE_INSTANCE_ID בקובץ .env.local
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">סריקת QR Code</h4>
                  <p className="text-sm text-muted-foreground">
                    לחץ על "הצג QR Code" וסרוק את הקוד באפליקציית WhatsApp שלך
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">התחלת השירות</h4>
                  <p className="text-sm text-muted-foreground">
                    לחץ על "התחל Instance" כדי להפעיל את השירות
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                  ✓
                </div>
                <div>
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