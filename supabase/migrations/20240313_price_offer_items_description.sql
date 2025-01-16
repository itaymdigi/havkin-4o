-- Add description and currency fields to price_offer_items table
ALTER TABLE price_offer_items
ADD COLUMN description TEXT NOT NULL,
ADD COLUMN currency TEXT NOT NULL DEFAULT 'ILS'; 