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

    // Check instance status
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

      let statusResult = null
      if (statusResponse.ok) {
        statusResult = await statusResponse.json()
      }

      return NextResponse.json({
        success: true,
        data: {
          configured: true,
          instanceID,
          status: statusResult?.status || 'unknown',
          statusDetails: statusResult,
          lastChecked: new Date().toISOString(),
          // Don't expose the token in the response
        },
      })
    } catch (statusError) {
      console.error('Error checking instance status:', statusError)
      return NextResponse.json({
        success: true,
        data: {
          configured: true,
          instanceID,
          status: 'error',
          error: 'Could not check instance status',
          // Don't expose the token in the response
        },
      })
    }

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
      case 'status':
        endpoint = 'https://wapulse.com/api/getInstanceStatus'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, qr, or status' },
          { status: 400 }
        )
    }

    console.log(`Performing WhatsApp ${action} action for instance ${instanceID}`)

    // Call WaPulse API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    let result
    try {
      const responseText = await response.text()
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse WaPulse API response:', parseError)
      return NextResponse.json(
        { error: 'Invalid response from WhatsApp service' },
        { status: 502 }
      )
    }

    if (!response.ok) {
      console.error('WaPulse API error:', {
        action,
        status: response.status,
        result
      })
      return NextResponse.json(
        { 
          error: result.message || `Failed to ${action} WhatsApp instance`,
          details: result,
          action
        },
        { status: response.status }
      )
    }

    console.log(`WhatsApp ${action} completed successfully:`, result)

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