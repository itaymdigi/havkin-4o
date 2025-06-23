import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

// Add timeout for fetch requests
const FETCH_TIMEOUT = 10000; // 10 seconds

async function fetchWithTimeout(url: string, options: RequestInit, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get environment variables
    const token = process.env.WAPULSE_TOKEN;
    const instanceID = process.env.WAPULSE_INSTANCE_ID;

    if (!token || !instanceID) {
      return NextResponse.json(
        {
          error: "WhatsApp configuration missing. Please check environment variables.",
          details: {
            hasToken: !!token,
            hasInstanceID: !!instanceID,
            requiredVars: ["WAPULSE_TOKEN", "WAPULSE_INSTANCE_ID"],
          },
        },
        { status: 500 }
      );
    }

    // Try multiple endpoints to check instance status
    const endpoints = [
      "https://wapulse.com/api/getQrCode",
      "https://wapulse.com/api/startInstance", // Sometimes this gives better status info
    ];

    let lastError = null;
    let lastResponse = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetchWithTimeout(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            instanceID,
          }),
        });

        const responseText = await response.text();
        let result = null;

        try {
          result = JSON.parse(responseText);
        } catch (_parseError) {
          lastError = {
            error: "Invalid JSON response",
            rawResponse: responseText.substring(0, 200),
            endpoint
          };
          continue;
        }

        lastResponse = result;

        // Handle specific responses
        if (result.error === "Invalid command") {
          lastError = {
            error: "WaPulse API endpoint not recognized",
            suggestion: "The WaPulse service may have changed their API. Please check their documentation or contact support.",
            endpoint,
            response: result
          };
          continue;
        }

        // If we get here, we have a valid response
        let status = "unknown";
        let needsQR = false;
        let qrCode = null;

        if (result.error) {
          if (result.error.includes("already connected") || result.error.includes("connected")) {
            status = "connected";
          } else if (result.error.includes("not found")) {
            status = "not_found";
          } else {
            status = "disconnected";
            needsQR = true;
          }
        } else if (result.qr) {
          status = "needs_qr";
          needsQR = true;
          qrCode = result.qr;
        } else if (result.success) {
          status = "connected";
        } else {
          status = "unknown";
        }

        return NextResponse.json({
          success: true,
          data: {
            configured: true,
            instanceID,
            status,
            needsQR,
            qrCode,
            lastChecked: new Date().toISOString(),
            endpoint: endpoint,
            apiResponse: result,
          },
        });

      } catch (fetchError) {
        lastError = {
          error: "Network error",
          details: fetchError instanceof Error ? fetchError.message : "Unknown fetch error",
          endpoint
        };
        continue;
      }
    }

    // If we get here, all endpoints failed
    return NextResponse.json(
      {
        success: false,
        error: "All WaPulse API endpoints failed",
        data: {
          configured: true,
          instanceID,
          status: "api_error",
          error: lastError?.error || "Unknown API error",
          suggestion: lastError?.error === "WaPulse API endpoint not recognized" 
            ? "The WaPulse service appears to be having issues or has changed their API. Please contact WaPulse support or try again later."
            : "There may be an issue with your WaPulse credentials or the service is down.",
          lastError,
          lastResponse,
          testedEndpoints: endpoints,
        },
      },
      { status: 502 }
    );

  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Get environment variables
    const token = process.env.WAPULSE_TOKEN;
    const instanceID = process.env.WAPULSE_INSTANCE_ID;

    if (!token || !instanceID) {
      return NextResponse.json(
        {
          error: "WhatsApp configuration missing. Please check environment variables.",
          details: {
            hasToken: !!token,
            hasInstanceID: !!instanceID,
            requiredVars: ["WAPULSE_TOKEN", "WAPULSE_INSTANCE_ID"],
          },
        },
        { status: 500 }
      );
    }

    let endpoint = "";
    const requestBody = { token, instanceID };

    switch (action) {
      case "start":
        endpoint = "https://wapulse.com/api/startInstance";
        break;
      case "stop":
        endpoint = "https://wapulse.com/api/stopInstance";
        break;
      case "qr":
        endpoint = "https://wapulse.com/api/getQrCode";
        break;
      case "status":
        // Use QR endpoint to check status since there's no dedicated status endpoint
        endpoint = "https://wapulse.com/api/getQrCode";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action. Use: start, stop, qr, or status" },
          { status: 400 }
        );
    }

    // Call WaPulse API with timeout
    let response;
    try {
      response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
    } catch (fetchError) {
      const isTimeout = fetchError instanceof Error && fetchError.name === "AbortError";
      return NextResponse.json(
        {
          error: isTimeout ? "Request timeout" : "Network error",
          details: `Failed to connect to WaPulse API for ${action}`,
          suggestion: "WaPulse service may be experiencing issues. Please try again later.",
          action,
        },
        { status: 503 }
      );
    }

    let result;
    try {
      const responseText = await response.text();
      result = JSON.parse(responseText);
    } catch (_parseError) {
      return NextResponse.json(
        {
          error: "Invalid response from WhatsApp service",
          details: `WaPulse API returned invalid JSON for ${action}`,
          suggestion: "The WaPulse service may be experiencing issues. Please try again later.",
          action,
        },
        { status: 502 }
      );
    }

    // Handle specific error cases
    if (result.error) {
      let errorMessage = result.error;
      let suggestion = "Check WhatsApp instance status";
      let statusCode = 400;

      if (result.error.includes("Invalid command")) {
        errorMessage = "WaPulse API service issue";
        suggestion = "The WaPulse service appears to be having issues or has changed their API. This is not an issue with your configuration. Please try again later or contact WaPulse support.";
        statusCode = 502;
      } else if (result.error.includes("already connected")) {
        // This is actually a success case for some actions
        if (action === "start" || action === "status") {
          return NextResponse.json({
            success: true,
            message: "WhatsApp instance is already connected",
            data: { ...result, status: "connected" },
          });
        }
      } else if (result.error.includes("not found")) {
        errorMessage = "WhatsApp instance not found";
        suggestion = "Your instance may have been deleted or the ID is incorrect. You may need to create a new instance.";
        statusCode = 404;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: result,
          suggestion,
          action,
          isWaPulseIssue: result.error.includes("Invalid command"),
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: `WhatsApp instance ${action} completed successfully`,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
