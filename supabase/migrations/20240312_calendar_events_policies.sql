-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own calendar events"
ON calendar_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar events"
ON calendar_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events"
ON calendar_events FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events"
ON calendar_events FOR DELETE
USING (auth.uid() = user_id); 