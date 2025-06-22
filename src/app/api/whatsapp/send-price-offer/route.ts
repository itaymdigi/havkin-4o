import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { validatePhoneNumber, formatPhoneNumber, generatePriceOfferMessage } from '@/lib/whatsapp'
import { getPriceOffer } from '@/lib/price-offers'
import { generatePriceOfferPDF } from '@/lib/pdf-utils'

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
    const { to, priceOfferId, includeFile = true, customMessage } = body

    // Validate required fields
    if (!to || !priceOfferId) {
      return NextResponse.json(
        { error: 'Phone number and price offer ID are required' },
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

    // Get environment variables
    const token = process.env.WAPULSE_TOKEN
    const instanceID = process.env.WAPULSE_INSTANCE_ID

    if (!token || !instanceID) {
      return NextResponse.json(
        { error: 'WhatsApp configuration missing. Please check environment variables.' },
        { status: 500 }
      )
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(to)

    // Get price offer data
    const priceOffer = await getPriceOffer(priceOfferId)
    if (!priceOffer) {
      return NextResponse.json(
        { error: 'Price offer not found' },
        { status: 404 }
      )
    }

    // Generate message
    const message = customMessage || generatePriceOfferMessage(priceOffer)

    // Send text message first
    const messageResponse = await fetch('https://wapulse.com/api/sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        instanceID,
        to: formattedPhone,
        message,
        type: 'user',
      }),
    })

    const messageResult = await messageResponse.json()

    if (!messageResponse.ok) {
      console.error('WaPulse message API error:', messageResult)
      return NextResponse.json(
        { error: messageResult.message || 'Failed to send WhatsApp message' },
        { status: messageResponse.status }
      )
    }

    let fileResult = null

    // Send PDF file if requested
    if (includeFile) {
      try {
        // Generate PDF (returns a blob URL)
        const pdfBlobUrl = generatePriceOfferPDF(priceOffer)
        
        // Fetch the blob from the URL
        const response = await fetch(pdfBlobUrl)
        const pdfBlob = await response.blob()
        
        // Convert blob to base64
        const arrayBuffer = await pdfBlob.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const dataUri = `data:application/pdf;base64,${base64}`

        // Send PDF file
        const fileResponse = await fetch('https://wapulse.com/api/sendFiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            instanceID,
            to: formattedPhone,
            files: [{
              file: dataUri,
              filename: `הצעת_מחיר_${priceOffer.offer_number}.pdf`,
              caption: `הצעת מחיר מספר ${priceOffer.offer_number}`,
            }],
          }),
        })

        fileResult = await fileResponse.json()

        if (!fileResponse.ok) {
          console.error('WaPulse file API error:', fileResult)
          // Don't fail the entire request if file sending fails
          fileResult = { error: fileResult.message || 'Failed to send PDF file' }
        }
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError)
        fileResult = { error: 'Failed to generate PDF file' }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Price offer sent successfully via WhatsApp',
      data: {
        messageResult,
        fileResult,
      },
    })

  } catch (error) {
    console.error('Error sending price offer via WhatsApp:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 