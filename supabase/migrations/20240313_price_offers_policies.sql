-- Enable RLS
ALTER TABLE price_offers ENABLE ROW LEVEL SECURITY;

-- Create policies for price_offers
CREATE POLICY "Users can view their own price offers"
ON price_offers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own price offers"
ON price_offers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own price offers"
ON price_offers FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own price offers"
ON price_offers FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS for price_offer_items
ALTER TABLE price_offer_items ENABLE ROW LEVEL SECURITY;

-- Create policies for price_offer_items
CREATE POLICY "Users can view their own price offer items"
ON price_offer_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM price_offers po
        WHERE po.id = price_offer_items.price_offer_id
        AND po.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create their own price offer items"
ON price_offer_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM price_offers po
        WHERE po.id = price_offer_items.price_offer_id
        AND po.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own price offer items"
ON price_offer_items FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM price_offers po
        WHERE po.id = price_offer_items.price_offer_id
        AND po.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own price offer items"
ON price_offer_items FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM price_offers po
        WHERE po.id = price_offer_items.price_offer_id
        AND po.user_id = auth.uid()
    )
); 