import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { savePriceOfferServer } from "@/lib/price-offers";
import type { PriceOffer } from "@/types/price-offer";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const priceOffer: PriceOffer = await request.json();

    // Validate the price offer data
    if (
      !priceOffer.id ||
      !priceOffer.customer ||
      !priceOffer.items ||
      priceOffer.items.length === 0
    ) {
      return NextResponse.json({ error: "Invalid price offer data" }, { status: 400 });
    }

    // Save the price offer using the server-side function
    const savedOffer = await savePriceOfferServer(priceOffer, userId);

    return NextResponse.json(
      {
        success: true,
        offer: savedOffer,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create price offer",
      },
      { status: 500 }
    );
  }
}
