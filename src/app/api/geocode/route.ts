import { NextResponse } from 'next/server';

// Cache for geocoding results (lasts for 24 hours)
const geocodeCache = new Map<string, { location: { lat: number; lng: number }; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'כתובת לא סופקה' }, { status: 400 });
    }

    // Check cache first
    const cachedResult = geocodeCache.get(address);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      return NextResponse.json({ location: cachedResult.location });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY environment variable is missing');
      console.error('Please add GOOGLE_MAPS_API_KEY to your environment variables');
      return NextResponse.json({ 
        error: 'Google Maps API key not configured. Please contact administrator.',
        details: 'GOOGLE_MAPS_API_KEY environment variable is missing'
      }, { status: 500 });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=he&region=IL`;
    
    console.log('Geocoding address:', address);
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Geocoding API response status:', data.status);

    if (data.status === 'OK' && data.results && data.results[0]) {
      const location = {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
      };

      // Cache the result
      geocodeCache.set(address, { location, timestamp: Date.now() });

      return NextResponse.json({ location });
    } else if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json({ error: 'לא נמצאו תוצאות לכתובת זו' }, { status: 404 });
    } else if (data.status === 'REQUEST_DENIED') {
      console.error('Geocoding request denied:', data.error_message);
      return NextResponse.json({ error: 'הבקשה נדחתה על ידי השרת' }, { status: 403 });
    } else {
      console.error('Geocoding error:', data);
      return NextResponse.json({ error: 'שגיאה בתהליך החיפוש' }, { status: 500 });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: 'שגיאת שרת' }, { status: 500 });
  }
} 