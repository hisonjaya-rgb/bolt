
-- Add garment_sheet_url column to articles table to store the uploaded file URL
ALTER TABLE public.articles 
ADD COLUMN garment_sheet_url TEXT;

-- Create storage bucket for garment sheets
INSERT INTO storage.buckets (id, name, public)
VALUES ('garment-sheets', 'garment-sheets', true);

-- Create RLS policy for garment sheets bucket - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload garment sheets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'garment-sheets' AND
  auth.role() = 'authenticated'
);

-- Create RLS policy for garment sheets bucket - allow authenticated users to view
CREATE POLICY "Authenticated users can view garment sheets"
ON storage.objects FOR SELECT
USING (bucket_id = 'garment-sheets');

-- Create RLS policy for garment sheets bucket - allow authenticated users to update
CREATE POLICY "Authenticated users can update garment sheets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'garment-sheets');

-- Create RLS policy for garment sheets bucket - allow authenticated users to delete
CREATE POLICY "Authenticated users can delete garment sheets"
ON storage.objects FOR DELETE
USING (bucket_id = 'garment-sheets');
