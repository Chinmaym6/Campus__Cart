-- Create custom types
CREATE TYPE item_condition AS ENUM ('brand_new', 'like_new', 'good', 'fair', 'for_parts');
CREATE TYPE item_status AS ENUM ('draft', 'available', 'pending', 'sold', 'unavailable');

-- Create items table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    condition item_condition NOT NULL,
    status item_status DEFAULT 'draft',
    -- Location
    location GEOGRAPHY(POINT, 4326),
    location_text VARCHAR(255),
    pickup_only BOOLEAN DEFAULT FALSE,
    willing_to_ship BOOLEAN DEFAULT FALSE,
    -- Photos
    photos JSONB DEFAULT '[]'::JSONB,
    primary_photo_url TEXT,
    -- AI Features
    detected_items JSONB,
    ai_confidence_score DECIMAL(3,2),
    photo_quality_score DECIMAL(3,2),
    listing_quality_score DECIMAL(3,2),
    -- Trade options
    open_to_trades BOOLEAN DEFAULT FALSE,
    -- Metrics
    view_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    -- Dates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sold_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon_name VARCHAR(50),
    parent_category_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);