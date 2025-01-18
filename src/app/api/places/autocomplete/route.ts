import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');

  if (!input) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('Server-side Google Maps API key is missing');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    console.log('Fetching predictions for input:', input);
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&key=${apiKey}&language=he&components=country:il&types=address`;

    console.log('API URL:', url.replace(apiKey, 'REDACTED'));
    
    const response = await fetch(url);
    const data = await response.json();

    console.log('Places API response status:', data.status);
    if (data.error_message) {
      console.error('Places API error:', data.error_message);
    }

    if (data.status === 'REQUEST_DENIED') {
      return NextResponse.json({ 
        error: 'אין הרשאה להשתמש ב-Google Maps API. סיבה: ' + data.error_message 
      }, { status: 403 });
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return NextResponse.json({ 
        error: 'שגיאה בשירות המפות: ' + data.status 
      }, { status: 500 });
    }

    return NextResponse.json({
      predictions: (data.predictions || []).map((prediction: any) => ({
        place_id: prediction.place_id,
        description: prediction.description,
      })),
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json({ 
      error: 'שגיאה בתקשורת עם שירות המפות' 
    }, { status: 500 });
  }
} 