import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/whatsapp";

// Add timeout for fetch requests
const FETCH_TIMEOUT = 15000; // 15 seconds for message sending

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

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { to, message, type = "user" } = body;

    // Validate required fields
    if (!to || !message) {
      return NextResponse.json({ error: "Phone number and message are required" }, { status: 400 });
    }

    // Validate phone number format
    if (!validatePhoneNumber(to)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Use format: 972512345678" },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(to);

    // Get environment variables
    const token = process.env.WAPULSE_TOKEN;
    const instanceID = process.env.WAPULSE_INSTANCE_ID;

    if (!token || !instanceID) {
      return NextResponse.json(
        {
          error:
            "WhatsApp configuration missing. Please check environment variables WAPULSE_TOKEN and WAPULSE_INSTANCE_ID.",
          details: {
            hasToken: !!token,
            hasInstanceID: !!instanceID,
            requiredVars: ["WAPULSE_TOKEN", "WAPULSE_INSTANCE_ID"],
          },
        },
        { status: 500 }
      );
    }

    // First, try to check if the instance is running with timeout
    try {
      const statusResponse = await fetchWithTimeout(
        "https://wapulse.com/api/getInstanceStatus",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            instanceID,
          }),
        },
        8000
      ); // Shorter timeout for status check

      if (statusResponse.ok) {
        const responseText = await statusResponse.text();
        let statusResult;

        try {
          statusResult = JSON.parse(responseText);

          if (
            statusResult?.status &&
            statusResult.status !== "connected" &&
            statusResult.status !== "ready"
          ) {
            return NextResponse.json(
              {
                error:
                  "WhatsApp instance is not connected. Please scan QR code and start the instance.",
                instanceStatus: statusResult.status,
                suggestion: "Go to WhatsApp settings to connect your instance.",
                details: statusResult,
              },
              { status: 503 }
            );
          }
        } catch {
          // Continue with sending message even if status parsing fails
        }
      } else {
        // Continue with sending message even if status check fails
      }
    } catch (_statusError) {
      // Continue with sending message even if status check fails
    }

    // Send message via WaPulse API with better error handling
    let response;
    let result;

    try {
      response = await fetchWithTimeout("https://wapulse.com/api/sendMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          instanceID,
          to: formattedPhone,
          message,
          type,
        }),
      });

      // Check if response is valid JSON
      const responseText = await response.text();

      try {
        result = JSON.parse(responseText);
      } catch (_parseError) {
        return NextResponse.json(
          {
            error: "Invalid response from WhatsApp service",
            details: "WaPulse API returned invalid JSON response",
            rawResponse: responseText.substring(0, 200),
            suggestion: "The WaPulse service may be experiencing issues. Please try again later.",
          },
          { status: 502 }
        );
      }
    } catch (fetchError) {
      const isTimeout = fetchError instanceof Error && fetchError.name === "AbortError";
      return NextResponse.json(
        {
          error: isTimeout ? "Request timeout" : "Failed to connect to WhatsApp service",
          details: isTimeout
            ? "The request to WaPulse API timed out"
            : fetchError instanceof Error
              ? fetchError.message
              : "Network error",
          suggestion: isTimeout
            ? "The WaPulse service is responding slowly. Please try again."
            : "WaPulse service may be down. Please try again later.",
        },
        { status: 503 }
      );
    }

    if (!response.ok) {
      // Handle specific error cases with better messaging
      let errorMessage = result?.message || result?.error || "Failed to send WhatsApp message";
      let suggestion = "Check WhatsApp instance status";
      const statusCode = response.status;

      if (response.status === 401) {
        errorMessage = "Invalid WhatsApp API credentials. Please check your token and instance ID.";
        suggestion = "Verify your WAPULSE_TOKEN and WAPULSE_INSTANCE_ID in environment variables";
      } else if (response.status === 404) {
        errorMessage = "WhatsApp instance not found. Please check your instance ID.";
        suggestion = "Verify your WAPULSE_INSTANCE_ID or create a new instance";
      } else if (response.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again later.";
        suggestion = "Wait a few minutes before sending more messages";
      } else if (result?.error === "Invalid command") {
        errorMessage = "WaPulse API endpoint not recognized";
        suggestion =
          "The WaPulse API may have changed. Please check their documentation or contact support.";
      } else if (response.status >= 500) {
        errorMessage = "WaPulse service error";
        suggestion = "The WaPulse service is experiencing issues. Please try again later.";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: result,
          statusCode,
          suggestion,
          debugInfo: {
            endpoint: "https://wapulse.com/api/sendMessage",
            instanceID,
            formattedPhone,
            timestamp: new Date().toISOString(),
          },
        },
        { status: statusCode >= 400 && statusCode < 500 ? statusCode : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp message sent successfully",
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        suggestion: "Please try again. If the problem persists, contact support.",
      },
      { status: 500 }
    );
  }
}
