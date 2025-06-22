import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { validatePhoneNumber, formatPhoneNumber } from '@/lib/whatsapp'

// Add timeout for fetch requests
const FETCH_TIMEOUT = 20000 // 20 seconds for file uploads

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
    const { to, file, filename, caption } = body

    // Validate required fields
    if (!to || !file || !filename) {
      return NextResponse.json(
        { error: 'Phone number, file, and filename are required' },
        { status: 400 }
      )
    }

    // Validate phone number format
    if (!validatePhoneNumber(to)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use format: 972512345678' },
        { status: 400 }
      )
    }

    // Validate file format (should be base64 with data URI)
    if (!file.startsWith('data:')) {
      return NextResponse.json(
        { error: 'File must be in base64 data URI format' },
        { status: 400 }
      )
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(to)

    // Get environment variables
    const token = process.env.WAPULSE_TOKEN
    const instanceID = process.env.WAPULSE_INSTANCE_ID

    if (!token || !instanceID) {
      console.error('Missing WhatsApp configuration for file sending:', {
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

    // Log for debugging
    console.log('Sending WhatsApp file:', {
      to: formattedPhone,
      filename,
      fileSize: file.length,
      hasCaption: !!caption,
      timestamp: new Date().toISOString()
    })

    // Prepare file data
    const fileData = {
      file,
      filename,
      ...(caption && { caption }),
    }

    // Send file via WaPulse API with better error handling
    let response
    let result
    
    try {
      console.log('Attempting to send WhatsApp file via WaPulse API...')
      
      response = await fetchWithTimeout('https://wapulse.com/api/sendFiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          instanceID,
          to: formattedPhone,
          files: [fileData],
        }),
      })

      const responseText = await response.text()
      console.log('WaPulse sendFiles API raw response:', {
        status: response.status,
        statusText: response.statusText,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 300)
      })

      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse WaPulse sendFiles API response:', {
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          responseText: responseText.substring(0, 500)
        })
        return NextResponse.json(
          { 
            error: 'Invalid response from WhatsApp service',
            details: 'WaPulse API returned invalid JSON response',
            suggestion: 'The WaPulse service may be experiencing issues. Please try again later.'
          },
          { status: 502 }
        )
      }

    } catch (fetchError) {
      console.error('Network error calling WaPulse sendFiles API:', {
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        errorName: fetchError instanceof Error ? fetchError.name : 'Unknown',
        timestamp: new Date().toISOString()
      })
      
      const isTimeout = fetchError instanceof Error && fetchError.name === 'AbortError'
      return NextResponse.json(
        { 
          error: isTimeout ? 'Request timeout' : 'Failed to connect to WhatsApp service',
          details: isTimeout ? 'File upload timed out' : (fetchError instanceof Error ? fetchError.message : 'Network error'),
          suggestion: isTimeout ? 
            'Large file uploads may take longer. Try a smaller file or try again.' :
            'WaPulse service may be down. Please try again later.'
        },
        { status: 503 }
      )
    }

    if (!response.ok) {
      console.error('WaPulse sendFiles API error:', {
        status: response.status,
        statusText: response.statusText,
        result
      })
      
      // Handle specific error cases
      let errorMessage = result?.message || result?.error || 'Failed to send WhatsApp file'
      let suggestion = 'Check WhatsApp instance status'
      
      if (response.status === 401) {
        errorMessage = 'Invalid WhatsApp API credentials'
        suggestion = 'Verify your WAPULSE_TOKEN and WAPULSE_INSTANCE_ID'
      } else if (response.status === 413) {
        errorMessage = 'File too large'
        suggestion = 'Try sending a smaller file'
      } else if (result?.error === 'Invalid command') {
        errorMessage = 'WaPulse API endpoint not recognized'
        suggestion = 'The WaPulse API may have changed. Please check their documentation.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: result,
          suggestion,
          statusCode: response.status
        },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 }
      )
    }

    console.log('WhatsApp file sent successfully:', result)

    return NextResponse.json({
      success: true,
      message: 'WhatsApp file sent successfully',
      data: result,
    })

  } catch (error) {
    console.error('Unexpected error sending WhatsApp file:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please try again. If the problem persists, contact support.'
      },
      { status: 500 }
    )
  }
} 