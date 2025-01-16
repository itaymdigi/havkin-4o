import { createBrowserClient } from '@supabase/ssr';
import { PriceOffer } from '@/types/price-offer';

export async function savePriceOffer(priceOffer: PriceOffer, userId: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // First, create the price offer record
    const { data: offer, error: offerError } = await supabase
      .from('price_offers')
      .insert({
        user_id: userId,
        status: 'draft',
        valid_until: new Date(priceOffer.validUntil),
        total_amount: priceOffer.total,
        notes: priceOffer.notes,
      })
      .select()
      .single();

    if (offerError) {
      console.error('Error creating price offer:', offerError);
      throw new Error(`Failed to create price offer: ${offerError.message}`);
    }

    // Then, create the price offer items
    const items = priceOffer.items.map(item => ({
      price_offer_id: offer.id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      description: item.description,
      currency: item.currency,
    }));

    const { error: itemsError } = await supabase
      .from('price_offer_items')
      .insert(items);

    if (itemsError) {
      console.error('Error creating price offer items:', itemsError);
      throw new Error(`Failed to create price offer items: ${itemsError.message}`);
    }

    // Create a notification for the user
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'הצעת מחיר חדשה נוצרה',
        message: `הצעת מחיר חדשה נוצרה עבור ${priceOffer.customer.name}`,
        type: 'price_offer',
        related_id: offer.id,
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't throw here, as the price offer was created successfully
    }

    return offer;
  } catch (error) {
    console.error('Error in savePriceOffer:', error);
    throw error;
  }
} 