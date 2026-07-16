-- Extension needed for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text search index for talent name fields using pg_trgm GIN index
CREATE INDEX IF NOT EXISTS idx_talent_fullname_trgm ON public.talent_profiles
  USING GIN (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_talent_stagename_trgm ON public.talent_profiles
  USING GIN (stage_name gin_trgm_ops);

-- Add foreign key constraint to enable nested querying (joining media_assets directly to talent_profiles via user_id)
ALTER TABLE public.media_assets
  ADD CONSTRAINT fk_media_assets_talent_profile
  FOREIGN KEY (owner_id) REFERENCES public.talent_profiles(user_id)
  ON DELETE CASCADE;
