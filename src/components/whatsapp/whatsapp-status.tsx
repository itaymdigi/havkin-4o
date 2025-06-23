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
  status: string;
  message?: string;
  details?: {
    configured: boolean;
    instanceId: string;
    hasToken: boolean;
    apiIssue?: string;
    suggestion?: string;
    timestamp?: string;
  };
  instanceId?: string;
  apiResponse?: Record<string, unknown>;
  timestamp?: string;
  qrCode?: string;
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

      if (response.ok) {
        setStatusData(result);
        setRetryCount(0); // Reset retry count on success
      } else {
        setError(result.error || result.details || "שגיאה בבדיקת סטטוס WhatsApp");
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

  const handleAction = async (action: "start" | "stop" | "getQr" | "test_wapulse") => {
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
        throw new Error(result.error || result.details || `Failed to ${action} instance`);
      }

      if (action === "getQr" && result.apiResponse?.qrCode) {
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
                  <img src="${result.apiResponse.qrCode}" alt="WhatsApp QR Code" />
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
      if (action !== "getQr") {
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
      case "configuration_ok":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <CheckCircle className="ml-1 h-3 w-3" />
            מוגדר נכון
          </Badge>
        );
      case "connected":
      case "ready":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="ml-1 h-3 w-3" />
            מחובר
          </Badge>
        );
      case "waiting_for_qr":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
            <QrCode className="ml-1 h-3 w-3" />
            מחכה לסריקה
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
      case "error":
        return (
          <Badge variant="destructive">
            <AlertCircle className="ml-1 h-3 w-3" />
            שגיאה
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
          סטטוס מופע WhatsApp
        </CardTitle>
        <CardDescription className="text-right">
          מצב נוכחי של מופע WhatsApp Business שלך
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {statusData ? (
          <>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              {statusData.status === "configuration_ok" ? (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">אין נתוני מופע זמינים</div>
                  {statusData.message && (
                    <p className="text-sm">{statusData.message}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-medium">סטטוס: {getStatusBadge(statusData.status)}</div>
                  {statusData.message && (
                    <p className="text-sm text-muted-foreground">{statusData.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>סטטוס תצורה:</span>
                <Badge variant={statusData.details?.configured || statusData.status === "configuration_ok" ? "default" : "destructive"}>
                  {statusData.details?.configured || statusData.status === "configuration_ok" ? (
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

              <div className="flex items-center justify-between">
                <span>סטטוס חיבור:</span>
                {getStatusBadge(statusData.status)}
              </div>

              <div className="flex items-center justify-between">
                <span>Instance ID:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded font-mono text-left" dir="ltr">
                  {statusData.instanceId || statusData.details?.instanceId || "N/A"}
                </code>
              </div>

              {statusData.timestamp && (
                <div className="flex items-center justify-between">
                  <span>נבדק לאחרונה:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(statusData.timestamp).toLocaleTimeString("he-IL")}
                  </span>
                </div>
              )}

              {statusData.details?.apiIssue && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">בעיית API:</p>
                      <p className="text-sm">{statusData.details.apiIssue}</p>
                      {statusData.details.suggestion && (
                        <p className="text-sm text-muted-foreground">{statusData.details.suggestion}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        ) : (
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">אין נתוני מופע זמינים</div>
          </div>
        )}

        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium text-right">פעולות מופע</h4>
          <p className="text-sm text-muted-foreground text-right">נהל את חיבור מופע WhatsApp שלך</p>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => checkStatus()}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-1" />
              ) : (
                <RefreshCw className="h-4 w-4 ml-1" />
              )}
              בדוק סטטוס
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAction("getQr")}
              disabled={!!actionLoading}
              className="w-full"
            >
              {actionLoading === "getQr" ? (
                <Loader2 className="h-4 w-4 animate-spin ml-1" />
              ) : (
                <QrCode className="h-4 w-4 ml-1" />
              )}
              קבל QR Code
            </Button>

            <Button
              variant="default"
              onClick={() => handleAction("start")}
              disabled={!!actionLoading}
              className="w-full"
            >
              {actionLoading === "start" ? (
                <Loader2 className="h-4 w-4 animate-spin ml-1" />
              ) : (
                <Power className="h-4 w-4 ml-1" />
              )}
              הפעל מופע
            </Button>

            <Button
              variant="destructive"
              onClick={() => handleAction("stop")}
              disabled={!!actionLoading}
              className="w-full"
            >
              {actionLoading === "stop" ? (
                <Loader2 className="h-4 w-4 animate-spin ml-1" />
              ) : (
                <PowerOff className="h-4 w-4 ml-1" />
              )}
              עצור מופע
            </Button>
          </div>

          <Button
            variant="secondary"
            onClick={() => handleAction("test_wapulse")}
            disabled={!!actionLoading}
            className="w-full"
          >
            {actionLoading === "test_wapulse" ? (
              <Loader2 className="h-4 w-4 animate-spin ml-1" />
            ) : (
              <AlertCircle className="h-4 w-4 ml-1" />
            )}
            בדוק WaPulse API
          </Button>
        </div>

        <div className="mt-6 space-y-3 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium text-right">פתרון בעיות</h4>

          <div className="space-y-2 text-sm">
            <div className="font-medium">שגיאות Bad Gateway 502:</div>
            <ul className="space-y-1 text-muted-foreground mr-4">
              <li>• ייתכן ששירות WaPulse חווה בעיות</li>
              <li>• בדוק שה-WAPULSE_TOKEN וה-WAPULSE_INSTANCE_ID נכונים</li>
              <li>• ודא שחשבון WaPulse שלך פעיל ויש בו קרדיטים</li>
              <li>• נסה ליצור מופע חדש אם הנוכחי פגום</li>
            </ul>

            <div className="font-medium mt-3">בעיות חיבור:</div>
            <ul className="space-y-1 text-muted-foreground mr-4">
              <li>• ודא שמופע WhatsApp שלך הופעל ומחובר</li>
              <li>• סרוק את קוד ה-QR באפליקציית WhatsApp שלך</li>
              <li>• בדוק את חיבור האינטרנט שלך</li>
              <li>• המתן כמה דקות ונסה שוב</li>
            </ul>

            <div className="font-medium mt-3">משתני סביבה:</div>
            <div className="text-muted-foreground">
              <div className="mt-1">ודא שהם מוגדרים בקובץ .env.local שלך:</div>
              <div className="mt-2 font-mono text-xs bg-muted p-2 rounded text-left" dir="ltr">
                WAPULSE_TOKEN=your_token_here<br/>
                WAPULSE_INSTANCE_ID=your_instance_id_here
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
