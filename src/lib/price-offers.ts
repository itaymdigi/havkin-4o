import { createBrowserClient } from '@supabase/ssr';
import { PriceOffer } from '@/types/price-offer';
import { supabaseConfig } from '@/config/supabase';

export async function savePriceOffer(priceOffer: PriceOffer, userId: string) {
  const supabase = createBrowserClient(
    supabaseConfig.url,
    supabaseConfig.anonKey
  );

  try {
    // Verify session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('No active session found');
    }

    // First, create the price offer record
    const { data: offer, error: offerError } = await supabase
      .from('price_offers')
      .insert({
        id: priceOffer.id,
        user_id: userId,
        status: 'draft',
        valid_until: new Date(priceOffer.validUntil).toISOString(),
        subtotal: priceOffer.subtotal,
        tax: priceOffer.tax,
        total: priceOffer.total,
        notes: priceOffer.notes || null,
        customer_name: priceOffer.customer.name,
        customer_email: priceOffer.customer.email,
        customer_phone: priceOffer.customer.phone,
        customer_address: priceOffer.customer.address,
        customer_company: priceOffer.customer.company || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (offerError) {
      console.error('Error creating price offer:', offerError);
      throw new Error(`Failed to create price offer: ${offerError.message}`);
    }

    // Then, create the price offer items
    const items = priceOffer.items.map(item => ({
      id: crypto.randomUUID(),
      price_offer_id: offer.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      currency: item.currency,
      total: item.total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: itemsError } = await supabase
      .from('price_offer_items')
      .insert(items);

    if (itemsError) {
      console.error('Error creating price offer items:', itemsError);
      // If items fail to create, delete the price offer to maintain consistency
      await supabase.from('price_offers').delete().eq('id', offer.id);
      throw new Error(`Failed to create price offer items: ${itemsError.message}`);
    }

    return offer;
  } catch (error) {
    console.error('Error in savePriceOffer:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to save price offer');
  }
} 