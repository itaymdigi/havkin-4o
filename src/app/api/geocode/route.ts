import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('Server-side Google Maps API key is missing');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    console.log('Geocoding address:', address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}&language=he&region=il`;

    const response = await fetch(url);
    const data = await response.json();

    console.log('Geocoding API response status:', data.status);
    if (data.error_message) {
      console.error('Geocoding API error:', data.error_message);
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

    if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json({ error: 'לא נמצאה כתובת תואמת' }, { status: 404 });
    }

    return NextResponse.json({
      location: data.results[0].geometry.location,
      formatted_address: data.results[0].formatted_address,
    });
  } catch (error) {
    console.error('Error geocoding address:', error);
    return NextResponse.json({ 
      error: 'שגיאה בתקשורת עם שירות המפות' 
    }, { status: 500 });
  }
} 