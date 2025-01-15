-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for contacts table
CREATE POLICY "Enable read access for all users" ON contacts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON contacts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON contacts
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON contacts
    FOR DELETE USING (true);

-- Enable RLS for companies table as well since it's related
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies for companies table
CREATE POLICY "Enable read access for all users" ON companies
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON companies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON companies
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON companies
    FOR DELETE USING (true); 