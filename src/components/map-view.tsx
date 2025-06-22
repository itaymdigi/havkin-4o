"use client";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { Loader2, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MapViewProps {
  address: string;
  className?: string;
}

interface GeocodingResult {
  lat: number;
  lng: number;
}

const containerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "0.5rem",
};

const mapOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  language: "he",
};

export function MapView({ address, className }: MapViewProps) {
  const [coordinates, setCoordinates] = useState<GeocodingResult>({
    lat: 31.7683, // Default to Jerusalem
    lng: 35.2137,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    language: "he",
    region: "IL",
  });

  // Memoize the map instance
  const map = useMemo(
    () =>
      coordinates ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={coordinates}
          zoom={15}
          options={mapOptions}
        >
          <Marker position={coordinates} />
        </GoogleMap>
      ) : null,
    [coordinates]
  );

  useEffect(() => {
    const geocodeAddress = async () => {
      if (!address) {
        setError("לא סופקה כתובת");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Add Israel to the address if not present
        const searchAddress = address.toLowerCase().includes("ישראל")
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
          setError("לא ניתן למצוא את המיקום במפה");
        }
      } catch (_err) {
        setError("שגיאה בטעינת המפה");
      } finally {
        setIsLoading(false);
      }
    };

    geocodeAddress();
  }, [address]);

  if (loadError) {
    return (
      <Alert variant="destructive" className={className}>
        <MapPin className="h-4 w-4" />
        <AlertDescription>שגיאה בטעינת המפה</AlertDescription>
      </Alert>
    );
  }

  if (!isLoaded || isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={containerStyle}
      >
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
        <AlertDescription>{error || "לא ניתן להציג את המיקום במפה"}</AlertDescription>
      </Alert>
    );
  }

  return map;
}
