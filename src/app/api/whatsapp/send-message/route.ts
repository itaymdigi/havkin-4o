import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { validatePhoneNumber, formatPhoneNumber } from '@/lib/whatsapp'

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
    const { to, message, type = 'user' } = body

    // Validate required fields
    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
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

    // Format phone number
    const formattedPhone = formatPhoneNumber(to)

    // Get environment variables
    const token = process.env.WAPULSE_TOKEN
    const instanceID = process.env.WAPULSE_INSTANCE_ID

    if (!token || !instanceID) {
      return NextResponse.json(
        { error: 'WhatsApp configuration missing. Please check environment variables WAPULSE_TOKEN and WAPULSE_INSTANCE_ID.' },
        { status: 500 }
      )
    }

    // Log for debugging (remove in production)
    console.log('Sending WhatsApp message:', {
      to: formattedPhone,
      messageLength: message.length,
      type,
      hasToken: !!token,
      hasInstanceID: !!instanceID,
      timestamp: new Date().toISOString()
    })

    // First, try to check if the instance is running
    try {
      const statusResponse = await fetch('https://wapulse.com/api/getInstanceStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          instanceID,
        }),
      })

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json()
        console.log('WhatsApp instance status:', statusResult)
        
        if (statusResult.status !== 'connected' && statusResult.status !== 'ready') {
          return NextResponse.json(
            { 
              error: 'WhatsApp instance is not connected. Please scan QR code and start the instance.',
              instanceStatus: statusResult.status,
              suggestion: 'Go to WhatsApp settings to connect your instance.'
            },
            { status: 503 }
          )
        }
      }
    } catch (statusError) {
      console.warn('Could not check instance status:', statusError)
      // Continue with sending message even if status check fails
    }

    // Send message via WaPulse API with better error handling
    let response
    let result
    
    try {
      response = await fetch('https://wapulse.com/api/sendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          instanceID,
          to: formattedPhone,
          message,
          type,
        }),
      })

      // Check if response is valid JSON
      const responseText = await response.text()
      console.log('WaPulse API raw response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 500) // Log first 500 chars
      })

      try {
        result = JSON.parse(responseText)
      } catch {
        console.error('Failed to parse WaPulse API response:', responseText)
        return NextResponse.json(
          { 
            error: 'Invalid response from WhatsApp service',
            rawResponse: responseText.substring(0, 200)
          },
          { status: 502 }
        )
      }

    } catch (fetchError) {
      console.error('Network error calling WaPulse API:', fetchError)
      return NextResponse.json(
        { 
          error: 'Failed to connect to WhatsApp service',
          details: fetchError instanceof Error ? fetchError.message : 'Network error'
        },
        { status: 503 }
      )
    }

    if (!response.ok) {
      console.error('WaPulse API error:', {
        status: response.status,
        statusText: response.statusText,
        result
      })
      
      // Handle specific error cases
      let errorMessage = result?.message || result?.error || 'Failed to send WhatsApp message'
      const statusCode = response.status
      
      if (response.status === 401) {
        errorMessage = 'Invalid WhatsApp API credentials. Please check your token and instance ID.'
      } else if (response.status === 404) {
        errorMessage = 'WhatsApp instance not found. Please check your instance ID.'
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: result,
          statusCode,
          suggestion: response.status === 401 ? 'Check your WaPulse credentials' : 
                     response.status === 404 ? 'Verify your instance ID' :
                     response.status === 429 ? 'Wait before retrying' : 'Check WhatsApp instance status'
        },
        { status: statusCode >= 400 && statusCode < 500 ? statusCode : 500 }
      )
    }

    console.log('WhatsApp message sent successfully:', result)

    return NextResponse.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      data: result,
    })

  } catch (error) {
    console.error('Unexpected error sending WhatsApp message:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 