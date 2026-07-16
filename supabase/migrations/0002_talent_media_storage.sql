-- Create talent-media bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('talent-media', 'talent-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder inside talent-media
CREATE POLICY "talent upload own media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'talent-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to update their own folder inside talent-media
CREATE POLICY "talent update own media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'talent-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to delete their own folder inside talent-media
CREATE POLICY "talent delete own media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'talent-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read access to talent-media objects
CREATE POLICY "public read talent media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'talent-media');
