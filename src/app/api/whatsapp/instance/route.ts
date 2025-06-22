import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Add timeout for fetch requests
const FETCH_TIMEOUT = 10000 // 10 seconds

async function fetchWithTimeout(url: string, options: RequestInit, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get environment variables
    const token = process.env.WAPULSE_TOKEN
    const instanceID = process.env.WAPULSE_INSTANCE_ID

    if (!token || !instanceID) {
      console.error('Missing WhatsApp configuration:', {
        hasToken: !!token,
        hasInstanceID: !!instanceID,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { 
          error: 'WhatsApp configuration missing. Please check environment variables.',
          details: {
            hasToken: !!token,
            hasInstanceID: !!instanceID,
            requiredVars: ['WAPULSE_TOKEN', 'WAPULSE_INSTANCE_ID']
          }
        },
        { status: 500 }
      )
    }

    // Check instance status with improved error handling
    try {
      console.log('Checking WaPulse instance status:', {
        instanceID,
        timestamp: new Date().toISOString(),
        endpoint: 'https://wapulse.com/api/getInstanceStatus'
      })

      const statusResponse = await fetchWithTimeout('https://wapulse.com/api/getInstanceStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          instanceID,
        }),
      })

      const responseText = await statusResponse.text()
      console.log('WaPulse API raw response:', {
        status: statusResponse.status,
        statusText: statusResponse.statusText,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200)
      })

      let statusResult = null
      try {
        statusResult = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse WaPulse status response:', {
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          responseText: responseText.substring(0, 500)
        })
        
        return NextResponse.json({
          success: false,
          error: 'WaPulse API returned invalid response',
          data: {
            configured: true,
            instanceID,
            status: 'api_error',
            error: 'Invalid response format from WaPulse API',
            rawResponse: responseText.substring(0, 200),
            suggestion: 'The WaPulse service may be experiencing issues. Please try again later or check your credentials.'
          },
        }, { status: 502 })
      }

      if (!statusResponse.ok) {
        console.error('WaPulse API error response:', {
          status: statusResponse.status,
          statusText: statusResponse.statusText,
          result: statusResult
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          configured: true,
          instanceID,
          status: statusResult?.status || 'unknown',
          statusDetails: statusResult,
          lastChecked: new Date().toISOString(),
          apiResponseStatus: statusResponse.status,
          // Don't expose the token in the response
        },
      })
    } catch (statusError) {
      console.error('Error checking instance status:', {
        error: statusError instanceof Error ? statusError.message : 'Unknown error',
        errorName: statusError instanceof Error ? statusError.name : 'Unknown',
        timestamp: new Date().toISOString()
      })
      
      // Check if it's a timeout or network error
      const isNetworkError = statusError instanceof Error && 
        (statusError.name === 'AbortError' || statusError.message.includes('fetch'))
      
      return NextResponse.json({
        success: false,
        error: 'Failed to check WhatsApp instance status',
        data: {
          configured: true,
          instanceID,
          status: 'connection_error',
          error: isNetworkError ? 'Network timeout or connection error' : 'API service error',
          suggestion: isNetworkError ? 
            'WaPulse service may be down. Please try again later.' : 
            'There may be an issue with your WaPulse credentials or the service.',
          // Don't expose the token in the response
        },
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Unexpected error getting WhatsApp instance info:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    // Get environment variables
    const token = process.env.WAPULSE_TOKEN
    const instanceID = process.env.WAPULSE_INSTANCE_ID

    if (!token || !instanceID) {
      return NextResponse.json(
        { 
          error: 'WhatsApp configuration missing. Please check environment variables.',
          details: {
            hasToken: !!token,
            hasInstanceID: !!instanceID,
            requiredVars: ['WAPULSE_TOKEN', 'WAPULSE_INSTANCE_ID']
          }
        },
        { status: 500 }
      )
    }

    let endpoint = ''
    const requestBody = { token, instanceID }

    switch (action) {
      case 'start':
        endpoint = 'https://wapulse.com/api/startInstance'
        break
      case 'stop':
        endpoint = 'https://wapulse.com/api/stopInstance'
        break
      case 'qr':
        endpoint = 'https://wapulse.com/api/getQrCode'
        break
      case 'status':
        endpoint = 'https://wapulse.com/api/getInstanceStatus'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, qr, or status' },
          { status: 400 }
        )
    }

    console.log(`Performing WhatsApp ${action} action:`, {
      instanceID,
      endpoint,
      timestamp: new Date().toISOString()
    })

    // Call WaPulse API with timeout
    let response
    try {
      response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
    } catch (fetchError) {
      console.error(`Network error during ${action}:`, {
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        errorName: fetchError instanceof Error ? fetchError.name : 'Unknown',
        endpoint
      })
      
      const isTimeout = fetchError instanceof Error && fetchError.name === 'AbortError'
      return NextResponse.json(
        { 
          error: isTimeout ? 'Request timeout' : 'Network error',
          details: `Failed to connect to WaPulse API for ${action}`,
          suggestion: 'WaPulse service may be experiencing issues. Please try again later.',
          action
        },
        { status: 503 }
      )
    }

    let result
    try {
      const responseText = await response.text()
      console.log(`WaPulse ${action} API raw response:`, {
        status: response.status,
        statusText: response.statusText,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200)
      })
      
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error(`Failed to parse WaPulse ${action} API response:`, {
        parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        status: response.status
      })
      return NextResponse.json(
        { 
          error: 'Invalid response from WhatsApp service',
          details: `WaPulse API returned invalid JSON for ${action}`,
          suggestion: 'The WaPulse service may be experiencing issues. Please try again later.',
          action
        },
        { status: 502 }
      )
    }

    if (!response.ok) {
      console.error(`WaPulse ${action} API error:`, {
        action,
        status: response.status,
        statusText: response.statusText,
        result
      })
      
      // Provide specific error messages based on common issues
      let errorMessage = result.message || result.error || `Failed to ${action} WhatsApp instance`
      let suggestion = 'Check WhatsApp instance status'
      
      if (response.status === 401) {
        errorMessage = 'Invalid WaPulse credentials'
        suggestion = 'Verify your WAPULSE_TOKEN in environment variables'
      } else if (response.status === 404) {
        errorMessage = 'WhatsApp instance not found'
        suggestion = 'Verify your WAPULSE_INSTANCE_ID or create a new instance'
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded'
        suggestion = 'Wait a moment before trying again'
      } else if (result.error === 'Invalid command') {
        errorMessage = 'WaPulse API endpoint not recognized'
        suggestion = 'The WaPulse API may have changed. Please check their documentation or contact support.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: result,
          suggestion,
          action,
          statusCode: response.status
        },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 }
      )
    }

    console.log(`WhatsApp ${action} completed successfully:`, result)

    return NextResponse.json({
      success: true,
      message: `WhatsApp instance ${action} completed successfully`,
      data: result,
    })

  } catch (error) {
    console.error('Unexpected error managing WhatsApp instance:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 