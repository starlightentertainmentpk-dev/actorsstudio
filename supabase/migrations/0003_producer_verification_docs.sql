-- Create producer-docs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('producer-docs', 'producer-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Allow producer to upload to their own folder inside producer-docs
CREATE POLICY "producer upload own docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'producer-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow admins to read producer docs
CREATE POLICY "admin read producer docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'producer-docs'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('super_admin', 'studio_admin', 'studio_staff')
    )
  );

-- Allow producer to read their own docs
CREATE POLICY "producer read own docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'producer-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Extend producer_profiles schema with social URLs and representative note columns
ALTER TABLE public.producer_profiles
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS representative_note TEXT;
