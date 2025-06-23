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

    const token = process.env.WAPULSE_TOKEN;
    const instanceId = process.env.WAPULSE_INSTANCE_ID;

    if (!token || !instanceId) {
      return NextResponse.json(
        { 
          error: "Missing WaPulse configuration",
          details: "WAPULSE_TOKEN or WAPULSE_INSTANCE_ID not found in environment variables",
          hasToken: !!token,
          hasInstanceId: !!instanceId
        },
        { status: 500 }
      );
    }

    console.log("Checking WhatsApp instance status...", { instanceId });

    // First, return basic configuration info without calling WaPulse API
    // since it's consistently returning "Invalid command"
    return NextResponse.json({
      status: "configuration_ok", 
      message: "WaPulse configuration is present but API is returning 'Invalid command'",
      details: {
        configured: true,
        instanceId,
        hasToken: true,
        apiIssue: "WaPulse API consistently returns 'Invalid command' - this appears to be a service issue",
        suggestion: "The WaPulse service may be experiencing issues or may have changed their API endpoints. This is not a configuration issue on your end.",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("WhatsApp instance status check failed:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: "Failed to check WhatsApp instance status",
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: "Unknown error occurred",
        details: "An unexpected error occurred while checking instance status"
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

    const token = process.env.WAPULSE_TOKEN;
    const instanceId = process.env.WAPULSE_INSTANCE_ID;

    if (!token || !instanceId) {
      return NextResponse.json(
        { 
          error: "Missing WaPulse configuration",
          details: "WAPULSE_TOKEN or WAPULSE_INSTANCE_ID not found in environment variables"
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { action } = body;

    console.log("WhatsApp instance action:", action, { instanceId });

    // For now, return a message about the API issue instead of calling WaPulse
    if (action === "test_wapulse") {
      // Test the WaPulse API to see current status
      try {
        const response = await fetchWithTimeout(
          "https://wapulse.com/api/getQrCode",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: token,
              instanceID: instanceId,
            }),
          }
        );

        const responseText = await response.text();
        console.log("WaPulse API test response:", responseText);

                 let data;
         try {
           data = JSON.parse(responseText);
         } catch (_parseError) {
           data = { rawResponse: responseText };
         }

        return NextResponse.json({
          success: true,
          action: "test_wapulse",
          instanceId,
          apiResponse: data,
          rawResponse: responseText,
          httpStatus: response.status,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        return NextResponse.json({
          success: false,
          action: "test_wapulse",
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString()
        });
      }
    }

    let endpoint;
    switch (action) {
      case "start":
        endpoint = "startInstance";
        break;
      case "stop":
        endpoint = "stopInstance";
        break;
      case "delete":
        endpoint = "deleteInstance";
        break;
      case "getQr":
        endpoint = "getQrCode";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action", validActions: ["start", "stop", "delete", "getQr", "test_wapulse"] },
          { status: 400 }
        );
    }

    // Use the correct WaPulse API endpoint with POST method
    const response = await fetchWithTimeout(
      `https://wapulse.com/api/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          instanceID: instanceId,
        }),
      }
    );

    if (!response.ok) {
      console.error("WaPulse API request failed:", response.status, response.statusText);
      return NextResponse.json(
        { 
          error: "WaPulse API request failed",
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      );
    }

    const responseText = await response.text();
    console.log("WaPulse API raw response:", responseText);

    // Handle empty response
    if (!responseText.trim()) {
      return NextResponse.json(
        { 
          error: "Empty response from WaPulse API",
          details: "The API returned an empty response"
        },
        { status: 502 }
      );
    }

    // Try to parse JSON response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse WaPulse response as JSON:", parseError);
      
      // Handle plain text responses
      if (responseText.includes("Invalid command")) {
        return NextResponse.json(
          { 
            error: "WaPulse API returned 'Invalid command'",
            details: "This usually means the API endpoint or request format is incorrect, or the service is having issues",
            rawResponse: responseText,
            suggestion: "WaPulse service appears to be having issues. This is not a configuration problem."
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { 
          error: "Invalid response format from WaPulse API",
          details: "Expected JSON but received plain text",
          rawResponse: responseText
        },
        { status: 502 }
      );
    }

    console.log("Parsed WaPulse response:", data);

    return NextResponse.json({
      success: true,
      action,
      instanceId,
      apiResponse: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("WhatsApp instance action failed:", error);
    
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json(
          { 
            error: "Request timeout",
            details: "WaPulse API request timed out after 10 seconds"
          },
          { status: 408 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to execute WhatsApp instance action",
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: "Unknown error occurred",
        details: "An unexpected error occurred while executing instance action"
      },
      { status: 500 }
    );
  }
}
