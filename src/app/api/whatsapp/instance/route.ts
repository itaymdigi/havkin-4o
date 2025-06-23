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

    // Since WaPulse doesn't have a direct status endpoint, we'll try to get QR code
    // If the instance is already connected, it will return an appropriate response
    try {
      const qrResponse = await fetchWithTimeout("https://wapulse.com/api/getQrCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          instanceID,
        }),
      });

      const responseText = await qrResponse.text();

      let qrResult = null;
      try {
        qrResult = JSON.parse(responseText);
      } catch (_parseError) {
        return NextResponse.json(
          {
            success: false,
            error: "WaPulse API returned invalid response",
            data: {
              configured: true,
              instanceID,
              status: "api_error",
              error: "Invalid response format from WaPulse API",
              rawResponse: responseText.substring(0, 200),
              suggestion:
                "The WaPulse service may be experiencing issues. Please try again later or check your credentials.",
            },
          },
          { status: 502 }
        );
      }

      // Determine status based on response
      let status = "unknown";
      let needsQR = false;
      
      if (qrResult.error) {
        if (qrResult.error.includes("already connected") || qrResult.error.includes("connected")) {
          status = "connected";
        } else if (qrResult.error.includes("Invalid command")) {
          status = "api_error";
        } else {
          status = "disconnected";
          needsQR = true;
        }
      } else if (qrResult.qr) {
        status = "needs_qr";
        needsQR = true;
      } else {
        status = "connected";
      }

      return NextResponse.json({
        success: true,
        data: {
          configured: true,
          instanceID,
          status,
          needsQR,
          qrCode: qrResult.qr || null,
          lastChecked: new Date().toISOString(),
          apiResponseStatus: qrResponse.status,
          apiResponse: qrResult,
        },
      });
    } catch (statusError) {
      // Check if it's a timeout or network error
      const isNetworkError =
        statusError instanceof Error &&
        (statusError.name === "AbortError" || statusError.message.includes("fetch"));

      return NextResponse.json(
        {
          success: false,
          error: "Failed to check WhatsApp instance status",
          data: {
            configured: true,
            instanceID,
            status: "connection_error",
            error: isNetworkError ? "Network timeout or connection error" : "API service error",
            suggestion: isNetworkError
              ? "WaPulse service may be down. Please try again later."
              : "There may be an issue with your WaPulse credentials or the service.",
          },
        },
        { status: 503 }
      );
    }
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
        errorMessage = "WaPulse API endpoint not recognized";
        suggestion = "The WaPulse API may have changed. Please check their documentation.";
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
        suggestion = "Verify your WAPULSE_INSTANCE_ID or create a new instance";
        statusCode = 404;
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: result,
          suggestion,
          action,
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
