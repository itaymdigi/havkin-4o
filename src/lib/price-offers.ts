import { createBrowserClient } from '@supabase/ssr';
import { PriceOffer } from '@/types/price-offer';
import { supabaseConfig } from '@/config/supabase';
import { createServerSupabaseServiceClient } from './supabase-server';

// Client-side function (for browser usage)
export async function savePriceOffer(priceOffer: PriceOffer, userId: string) {
  const supabase = createBrowserClient(
    supabaseConfig.url,
    supabaseConfig.anonKey
  );

  try {
    // Since we're using Clerk for auth, we don't need to verify Supabase session
    // Just validate that we have a userId from Clerk
    if (!userId) {
      throw new Error('User ID is required');
    }

    // First, create the price offer record
    const { data: offer, error: offerError } = await supabase
      .from('price_offers')
      .insert({
        id: priceOffer.id,
        user_id: userId,
        status: 'draft',
        valid_until: new Date(priceOffer.validUntil).toISOString(),
        total_amount: priceOffer.total,
        notes: priceOffer.notes || null,
        // Add customer fields
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

// Server-side function (for API routes)
export async function savePriceOfferServer(priceOffer: PriceOffer, userId: string) {
  const supabase = createServerSupabaseServiceClient();

  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // First, create the price offer record
    const { data: offer, error: offerError } = await supabase
      .from('price_offers')
      .insert({
        id: priceOffer.id,
        user_id: userId,
        status: 'draft',
        valid_until: new Date(priceOffer.validUntil).toISOString(),
        total_amount: priceOffer.total,
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
    console.error('Error in savePriceOfferServer:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to save price offer');
  }
}

// Server-side function to get a price offer by ID
export async function getPriceOffer(priceOfferId: string) {
  const supabase = createServerSupabaseServiceClient();

  try {
    // Get the price offer with its items
    const { data: offer, error: offerError } = await supabase
      .from('price_offers')
      .select(`
        *,
        price_offer_items (*)
      `)
      .eq('id', priceOfferId)
      .single();

    if (offerError) {
      console.error('Error fetching price offer:', offerError);
      return null;
    }

    if (!offer) {
      return null;
    }

    // Transform the data to match the expected format
    const transformedOffer = {
      ...offer,
      offer_number: offer.id.slice(-8).toUpperCase(), // Generate offer number from ID
      items: offer.price_offer_items || [],
      customer: {
        name: offer.customer_name,
        email: offer.customer_email,
        phone: offer.customer_phone,
        address: offer.customer_address,
        company: offer.customer_company,
      },
    };

    return transformedOffer;
  } catch (error) {
    console.error('Error in getPriceOffer:', error);
    return null;
  }
} 