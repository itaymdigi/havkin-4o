import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

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
      return NextResponse.json(
        { error: 'WhatsApp configuration missing. Please check environment variables.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        configured: true,
        instanceID,
        // Don't expose the token in the response
      },
    })

  } catch (error) {
    console.error('Error getting WhatsApp instance info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
        { error: 'WhatsApp configuration missing. Please check environment variables.' },
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
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, or qr' },
          { status: 400 }
        )
    }

    // Call WaPulse API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('WaPulse API error:', result)
      return NextResponse.json(
        { error: result.message || `Failed to ${action} WhatsApp instance` },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: `WhatsApp instance ${action} completed successfully`,
      data: result,
    })

  } catch (error) {
    console.error('Error managing WhatsApp instance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 