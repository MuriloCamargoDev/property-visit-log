
-- Create a public bucket for temporary visit photo uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-photos', 'visit-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to visit-photos bucket
CREATE POLICY "Authenticated users can upload visit photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'visit-photos');

-- Allow public read access for the webhook to download
CREATE POLICY "Public read access for visit photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'visit-photos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete visit photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'visit-photos');
