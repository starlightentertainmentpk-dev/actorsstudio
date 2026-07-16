-- Seed categories
INSERT INTO public.categories (name, slug, parent_id, sort_order) VALUES
  ('Actor', 'actor', NULL, 1),
  ('Model', 'model', NULL, 2),
  ('Voice Artist', 'voice-artist', NULL, 3),
  ('Dancer', 'dancer', NULL, 4),
  ('Musician', 'musician', NULL, 5),
  ('Influencer', 'influencer', NULL, 6),
  ('Child Artist', 'child-artist', NULL, 7)
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories for Actor
WITH actor AS (SELECT id FROM categories WHERE slug = 'actor')
INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
  ('Film Actor',    'film-actor',    (SELECT id FROM actor), 1),
  ('TV Actor',      'tv-actor',      (SELECT id FROM actor), 2),
  ('Theatre Actor', 'theatre-actor', (SELECT id FROM actor), 3),
  ('Child Actor',   'child-actor-film', (SELECT id FROM actor), 4)
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories for Model
WITH model AS (SELECT id FROM categories WHERE slug = 'model')
INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
  ('Fashion Model',    'fashion-model',    (SELECT id FROM model), 1),
  ('Commercial Model', 'commercial-model', (SELECT id FROM model), 2),
  ('Fitness Model',    'fitness-model',    (SELECT id FROM model), 3),
  ('Runway Model',     'runway-model',     (SELECT id FROM model), 4)
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories for Voice Artist
WITH va AS (SELECT id FROM categories WHERE slug = 'voice-artist')
INSERT INTO categories (name, slug, parent_id, sort_order) VALUES
  ('Dubbing Artist', 'dubbing-artist', (SELECT id FROM va), 1),
  ('Radio Jockey',   'radio-jockey',   (SELECT id FROM va), 2),
  ('Podcast Host',   'podcast-host',   (SELECT id FROM va), 3)
ON CONFLICT (slug) DO NOTHING;
