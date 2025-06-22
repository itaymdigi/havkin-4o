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
      return NextResponse.json(
        { error: 'WhatsApp configuration missing. Please check environment variables.' },
        { status: 500 }
      )
    }

    // Prepare file data
    const fileData = {
      file,
      filename,
      ...(caption && { caption }),
    }

    // Send file via WaPulse API
    const response = await fetch('https://wapulse.com/api/sendFiles', {
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

    const result = await response.json()

    if (!response.ok) {
      console.error('WaPulse API error:', result)
      return NextResponse.json(
        { error: result.message || 'Failed to send WhatsApp file' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp file sent successfully',
      data: result,
    })

  } catch (error) {
    console.error('Error sending WhatsApp file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 