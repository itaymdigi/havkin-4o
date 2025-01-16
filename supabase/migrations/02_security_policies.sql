-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for contacts table
CREATE POLICY "contacts_select" ON contacts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "contacts_insert" ON contacts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_update" ON contacts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "contacts_delete" ON contacts
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies for companies table
CREATE POLICY "companies_select" ON companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "companies_insert" ON companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "companies_update" ON companies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "companies_delete" ON companies
    FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage policies for documents bucket
CREATE POLICY "documents_insert" 
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "documents_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "documents_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "documents_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
); 