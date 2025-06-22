"use client";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  RefreshCw,
  Send,
  Settings,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppSendDialog } from "@/components/whatsapp/whatsapp-send-dialog";
import { WhatsAppStatus } from "@/components/whatsapp/whatsapp-status";

interface WhatsAppInstanceData {
  configured: boolean;
  instanceID: string;
  status: string;
  statusDetails?: Record<string, unknown>;
  lastChecked: string;
  apiResponseStatus?: number;
  error?: string;
  suggestion?: string;
}

interface ApiResponse {
  success: boolean;
  data?: WhatsAppInstanceData;
  error?: string;
  message?: string;
}

export default function WhatsAppPage() {
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("שלום! זוהי הודעת בדיקה מ-CRM חבקין 👋");
  const [instanceData, setInstanceData] = useState<WhatsAppInstanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const handleQuickSend = () => {
    if (!testPhone.trim()) {
      toast.error("נא להזין מספר טלפון");
      return;
    }
    setShowSendDialog(true);
  };

  const fetchInstanceStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/whatsapp/instance");
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setInstanceData(data.data);
      } else {
        setError(data.error || "Failed to fetch instance status");
        // Still set instance data if available for debugging
        if (data.data) {
          setInstanceData(data.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (action: string) => {
    try {
      setActionLoading(action);
      setError(null);

      const response = await fetch("/api/whatsapp/instance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh status after action
        await fetchInstanceStatus();
      } else {
        setError(data.error || `Failed to ${action} instance`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchInstanceStatus();
  }, [fetchInstanceStatus]);

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case "connected":
      case "ready":
        return "default";
      case "connecting":
      case "starting":
        return "secondary";
      case "disconnected":
      case "stopped":
      case "error":
      case "api_error":
      case "connection_error":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "connected":
      case "ready":
        return <CheckCircle className="h-4 w-4" />;
      case "connecting":
      case "starting":
        return <Clock className="h-4 w-4" />;
      case "error":
      case "api_error":
      case "connection_error":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const features = [
    {
      icon: MessageSquare,
      title: "שליחת הודעות",
      description: "שלח הודעות טקסט ללקוחות דרך WhatsApp",
      color: "text-blue-600",
    },
    {
      icon: FileText,
      title: "שליחת קבצים",
      description: "שלח הצעות מחיר, חשבוניות ומסמכים כקבצי PDF",
      color: "text-red-600",
    },
    {
      icon: Users,
      title: "ניהול קבוצות",
      description: "צור וניהל קבוצות WhatsApp ללקוחות",
      color: "text-purple-600",
    },
    {
      icon: Settings,
      title: "אוטומציה",
      description: "הגדר תזכורות אוטומטיות ומעקב אחר לקוחות",
      color: "text-orange-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6" dir="rtl">
        <PageHeader title="WhatsApp Integration" />
        <p className="text-muted-foreground mb-6 text-right">
          נהל את החיבור שלך ל-WhatsApp ושלח הודעות ללקוחות
        </p>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <strong>Error:</strong> {error}
                </p>
                {instanceData?.suggestion && (
                  <p>
                    <strong>Suggestion:</strong> {instanceData.suggestion}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

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
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <feature.icon className={`h-6 w-6 ${feature.color} mt-1 flex-shrink-0`} />
                      <div className="text-right">
                        <h4 className="font-semibold">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
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
                <Label htmlFor="test-phone" className="text-right">
                  מספר טלפון
                </Label>
                <div className="relative">
                  <Input
                    id="test-phone"
                    placeholder="972512345678"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value.replace(/[^\d]/g, ""))}
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
                <Label htmlFor="test-message" className="text-right">
                  הודעה
                </Label>
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

        <Separator />

        {/* Instance Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              WhatsApp Instance Status
              {instanceData && getStatusIcon(instanceData.status)}
            </CardTitle>
            <CardDescription>Current status of your WhatsApp Business instance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading instance status...</span>
              </div>
            ) : instanceData ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={getStatusColor(instanceData.status)}>
                    {instanceData.status || "Unknown"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Instance ID:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {instanceData.instanceID}
                  </code>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Configured:</span>
                  <Badge variant={instanceData.configured ? "default" : "destructive"}>
                    {instanceData.configured ? "Yes" : "No"}
                  </Badge>
                </div>

                {instanceData.apiResponseStatus && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Response:</span>
                    <Badge
                      variant={instanceData.apiResponseStatus === 200 ? "default" : "destructive"}
                    >
                      {instanceData.apiResponseStatus}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Checked:</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(instanceData.lastChecked).toLocaleString()}
                  </span>
                </div>

                {/* Diagnostic Information */}
                {instanceData.error && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Diagnostic Info:</h4>
                    <p className="text-xs text-muted-foreground">{instanceData.error}</p>
                  </div>
                )}

                {/* Status Details */}
                {instanceData.statusDetails && (
                  <details className="mt-4">
                    <summary className="text-sm font-medium cursor-pointer">
                      Raw Status Details
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(instanceData.statusDetails, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No instance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Instance Actions</CardTitle>
            <CardDescription>Manage your WhatsApp instance connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => performAction("status")}
              disabled={!!actionLoading}
              variant="outline"
              className="w-full"
            >
              {actionLoading === "status" && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Check Status
            </Button>

            <Button
              onClick={() => performAction("qr")}
              disabled={!!actionLoading}
              variant="outline"
              className="w-full"
            >
              {actionLoading === "qr" && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Get QR Code
            </Button>

            <Button
              onClick={() => performAction("start")}
              disabled={!!actionLoading}
              className="w-full"
            >
              {actionLoading === "start" && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Start Instance
            </Button>

            <Button
              onClick={() => performAction("stop")}
              disabled={!!actionLoading}
              variant="destructive"
              className="w-full"
            >
              {actionLoading === "stop" && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Stop Instance
            </Button>
          </CardContent>
        </Card>

        {/* Send Message Section */}
        <Card>
          <CardHeader>
            <CardTitle>Send WhatsApp Message</CardTitle>
            <CardDescription>Send messages through your WhatsApp Business account</CardDescription>
          </CardHeader>
          <CardContent>
            {instanceData?.status === "connected" || instanceData?.status === "ready" ? (
              <div className="space-y-4">
                <Button onClick={() => setSendDialogOpen(true)} className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send WhatsApp Message
                </Button>
                <WhatsAppSendDialog
                  open={sendDialogOpen}
                  onOpenChange={setSendDialogOpen}
                  defaultPhone={testPhone}
                  defaultMessage={testMessage}
                />
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  WhatsApp instance must be connected before sending messages. Please connect your
                  instance first by scanning the QR code.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Troubleshooting Section */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">502 Bad Gateway Errors:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• WaPulse API service may be experiencing issues</li>
                <li>• Check if your WAPULSE_TOKEN and WAPULSE_INSTANCE_ID are correct</li>
                <li>• Verify your WaPulse account is active and has credits</li>
                <li>• Try creating a new instance if the current one is corrupted</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Connection Issues:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Ensure your WhatsApp instance is started and connected</li>
                <li>• Scan the QR code with your WhatsApp mobile app</li>
                <li>• Check your internet connection</li>
                <li>• Wait a few minutes and try again</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Environment Variables:</h4>
              <div className="text-sm space-y-1">
                <p>
                  Make sure these are set in your <code>.env.local</code> file:
                </p>
                <pre className="bg-muted p-2 rounded text-xs">
                  {`WAPULSE_TOKEN=your_token_here
WAPULSE_INSTANCE_ID=your_instance_id_here`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
