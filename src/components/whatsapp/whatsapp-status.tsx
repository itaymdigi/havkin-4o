"use client";

import {
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageSquare,
  Power,
  PowerOff,
  QrCode,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WhatsAppStatusProps {
  className?: string;
}

interface InstanceStatus {
  configured: boolean;
  instanceID: string;
  status?: string;
  statusDetails?: Record<string, unknown>;
  lastChecked?: string;
  error?: string;
}

export function WhatsAppStatus({ className }: WhatsAppStatusProps) {
  const [statusData, setStatusData] = useState<InstanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [_retryCount, setRetryCount] = useState(0);
  const _MAX_RETRIES = 3;

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/whatsapp/instance");
      const result = await response.json();

      if (response.ok && result.success) {
        setStatusData(result.data);
        setRetryCount(0); // Reset retry count on success
      } else {
        setError(result.error || "שגיאה בבדיקת סטטוס WhatsApp");
        setRetryCount(prev => prev + 1);
      }
    } catch (_error) {
      setError("שגיאה בחיבור לשרת");
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only check status on initial mount
    checkStatus();
  }, [checkStatus]); // Include checkStatus dependency

  const handleAction = async (action: "start" | "stop" | "qr" | "status") => {
    setActionLoading(action);
    setError(null);

    try {
      const response = await fetch("/api/whatsapp/instance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} instance`);
      }

      if (action === "qr" && result.data?.qrCode) {
        // Show QR code in a dialog or new window
        const qrWindow = window.open("", "_blank", "width=500,height=600");
        if (qrWindow) {
          qrWindow.document.write(`
            <html>
              <head>
                <title>WhatsApp QR Code</title>
                <style>
                  body { margin:0; padding:20px; text-align:center; font-family:Arial,sans-serif; background:#f5f5f5; }
                  .container { background:white; padding:30px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.1); max-width:400px; margin:0 auto; }
                  h2 { color:#25D366; margin-bottom:20px; }
                  img { max-width:100%; height:auto; border:2px solid #25D366; border-radius:10px; }
                  p { color:#666; font-size:14px; margin-top:15px; }
                  .steps { text-align:right; margin-top:20px; }
                  .step { margin:10px 0; padding:10px; background:#f9f9f9; border-radius:5px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h2>🔗 חיבור WhatsApp</h2>
                  <img src="${result.data.qrCode}" alt="WhatsApp QR Code" />
                  <p>סרוק קוד זה באפליקציית WhatsApp שלך</p>
                  <div class="steps">
                    <div class="step">1. פתח את WhatsApp במכשיר שלך</div>
                    <div class="step">2. לך להגדרות > מכשירים מקושרים</div>
                    <div class="step">3. לחץ על "קשר מכשיר"</div>
                    <div class="step">4. סרוק את הקוד</div>
                  </div>
                </div>
              </body>
            </html>
          `);
        }
      }

      // Refresh status after action
      if (action !== "qr") {
        setTimeout(checkStatus, 1000);
      }

      toast.success(result.message || `${action} completed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `שגיאה ב-${action}`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "connected":
      case "ready":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="ml-1 h-3 w-3" />
            מחובר
          </Badge>
        );
      case "disconnected":
      case "closed":
        return (
          <Badge variant="destructive">
            <XCircle className="ml-1 h-3 w-3" />
            מנותק
          </Badge>
        );
      case "connecting":
      case "opening":
        return (
          <Badge variant="secondary">
            <Loader2 className="ml-1 h-3 w-3 animate-spin" />
            מתחבר...
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="ml-1 h-3 w-3" />
            לא ידוע
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-center" dir="rtl">
            <Loader2 className="h-6 w-6 animate-spin ml-2" />
            <span>בודק סטטוס WhatsApp...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <MessageSquare className="h-5 w-5 text-green-600" />
          סטטוס WhatsApp
        </CardTitle>
        <CardDescription className="text-right">נהל את החיבור שלך ל-WhatsApp Web</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <span>סטטוס תצורה:</span>
          <Badge variant={statusData?.configured ? "default" : "destructive"}>
            {statusData?.configured ? (
              <>
                <CheckCircle className="ml-1 h-3 w-3" />
                מוגדר
              </>
            ) : (
              <>
                <XCircle className="ml-1 h-3 w-3" />
                לא מוגדר
              </>
            )}
          </Badge>
        </div>

        {statusData?.configured && (
          <>
            <div className="flex items-center justify-between">
              <span>סטטוס חיבור:</span>
              {getStatusBadge(statusData.status)}
            </div>

            <div className="flex items-center justify-between">
              <span>Instance ID:</span>
              <code className="text-sm bg-muted px-2 py-1 rounded font-mono text-left" dir="ltr">
                {statusData.instanceID}
              </code>
            </div>

            {statusData.lastChecked && (
              <div className="flex items-center justify-between">
                <span>נבדק לאחרונה:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(statusData.lastChecked).toLocaleTimeString("he-IL")}
                </span>
              </div>
            )}
          </>
        )}

        {!statusData?.configured ? (
          <div className="text-center py-4 space-y-4">
            <p className="text-muted-foreground">
              נא להגדיר את משתני הסביבה WAPULSE_TOKEN ו-WAPULSE_INSTANCE_ID
            </p>
            <Button variant="outline" onClick={checkStatus} className="w-full">
              <RefreshCw className="ml-2 h-4 w-4" />
              בדוק שוב
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleAction("status")}
                disabled={actionLoading !== null}
                className="flex-1 justify-center"
                size="sm"
              >
                {actionLoading === "status" ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="ml-2 h-4 w-4" />
                )}
                רענן סטטוס
              </Button>

              <Button
                variant="outline"
                onClick={() => handleAction("qr")}
                disabled={actionLoading !== null}
                className="flex-1 justify-center"
                size="sm"
              >
                {actionLoading === "qr" ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="ml-2 h-4 w-4" />
                )}
                הצג QR Code
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleAction("start")}
                disabled={actionLoading !== null}
                className="flex-1 justify-center"
                size="sm"
              >
                {actionLoading === "start" ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Power className="ml-2 h-4 w-4" />
                )}
                התחל Instance
              </Button>

              <Button
                variant="outline"
                onClick={() => handleAction("stop")}
                disabled={actionLoading !== null}
                className="flex-1 justify-center"
                size="sm"
              >
                {actionLoading === "stop" ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <PowerOff className="ml-2 h-4 w-4" />
                )}
                עצור Instance
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
