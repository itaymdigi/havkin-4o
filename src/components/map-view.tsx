'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Loader2, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MapViewProps {
  address: string;
  className?: string;
}

interface GeocodingResult {
  lat: number;
  lng: number;
}

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 31.7683,  // Default to Jerusalem
  lng: 35.2137
};

export function MapView({ address, className }: MapViewProps) {
  const [coordinates, setCoordinates] = useState<GeocodingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const geocodeAddress = async () => {
      if (!address) {
        setError('לא סופקה כתובת');
        setIsLoading(false);
        return;
      }

      if (!apiKey) {
        console.error('Google Maps API key is missing');
        setError('נדרש מפתח Google Maps API');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Add Israel to the address if not present
        const searchAddress = address.toLowerCase().includes('ישראל') 
          ? address 
          : `${address}, ישראל`;

        const response = await fetch(`/api/geocode?address=${encodeURIComponent(searchAddress)}`);
        const data = await response.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        if (data.location) {
          setCoordinates(data.location);
        } else {
          setError('לא ניתן למצוא את המיקום במפה');
        }
      } catch (err) {
        console.error('Error geocoding address:', err);
        setError('שגיאה בטעינת המפה');
      } finally {
        setIsLoading(false);
      }
    };

    geocodeAddress();
  }, [address, apiKey]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={containerStyle}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <p className="text-sm text-gray-500">טוען מפה...</p>
        </div>
      </div>
    );
  }

  if (error || !coordinates) {
    return (
      <Alert variant="destructive" className={className}>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          {error || 'לא ניתן להציג את המיקום במפה'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={coordinates}
        zoom={15}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          language: 'he',
        }}
      >
        <Marker position={coordinates} />
      </GoogleMap>
    </LoadScript>
  );
} 