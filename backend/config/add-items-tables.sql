CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TYPE item_condition AS ENUM ('brand_new', 'like_new', 'good', 'fair', 'for_parts');
CREATE TYPE item_status AS ENUM ('draft', 'available', 'pending', 'sold', 'unavailable');

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon_name VARCHAR(50),
  parent_category_id UUID REFERENCES categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  condition item_condition NOT NULL,
  status item_status DEFAULT 'draft',
  deleted_at TIMESTAMP WITH TIME ZONE,
  location GEOGRAPHY(POINT, 4326),
  location_text VARCHAR(255),
  pickup_only BOOLEAN DEFAULT FALSE,
  willing_to_ship BOOLEAN DEFAULT FALSE,
  photos JSONB DEFAULT '[]'::JSONB,
  primary_photo_url TEXT,
  negotiable BOOLEAN DEFAULT FALSE,
  firm BOOLEAN DEFAULT FALSE,
  payment_methods JSONB DEFAULT '[]'::JSONB,
  detected_items JSONB,
  ai_confidence_score DECIMAL(3,2),
  photo_quality_score DECIMAL(3,2),
  listing_quality_score DECIMAL(3,2),
  open_to_trades BOOLEAN DEFAULT FALSE,
  trade_description TEXT,
  trade_preference TEXT,
  meetup_locations JSONB DEFAULT '[]'::JSONB,
  meetup_location GEOGRAPHY(POINT, 4326),
  meetup_location_text VARCHAR(255),
  meetup_description TEXT,
  location_description TEXT,
  availability JSONB DEFAULT '[]'::JSONB,
  special_instructions TEXT,
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sold_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Insert default categories if they don't exist
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Books & Study Materials', 'books-study-materials', 1),
  ('Electronics', 'electronics', 2),
  ('Furniture', 'furniture', 3),
  ('Clothing & Accessories', 'clothing-accessories', 4),
  ('Sports & Recreation', 'sports-recreation', 5),
  ('Appliances', 'appliances', 6),
  ('Vehicles', 'vehicles', 7),
  ('Other', 'other', 8)
ON CONFLICT (slug) DO NOTHING;