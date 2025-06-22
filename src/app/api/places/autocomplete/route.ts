import { NextResponse } from "next/server";

interface GooglePlacesPrediction {
  place_id: string;
  description: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input");

  if (!input) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Google Maps API key not configured. Please contact administrator.",
        details: "GOOGLE_MAPS_API_KEY environment variable is missing",
      },
      { status: 500 }
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&key=${apiKey}&language=he&components=country:il&types=address`;

    const response = await fetch(url);
    const data = await response.json();
    if (data.error_message) {
    }

    if (data.status === "REQUEST_DENIED") {
      return NextResponse.json(
        {
          error: `אין הרשאה להשתמש ב-Google Maps API. סיבה: ${data.error_message}`,
        },
        { status: 403 }
      );
    }

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json(
        {
          error: `שגיאה בשירות המפות: ${data.status}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      predictions: (data.predictions || []).map((prediction: GooglePlacesPrediction) => ({
        place_id: prediction.place_id,
        description: prediction.description,
      })),
    });
  } catch (_error) {
    return NextResponse.json(
      {
        error: "שגיאה בתקשורת עם שירות המפות",
      },
      { status: 500 }
    );
  }
}
