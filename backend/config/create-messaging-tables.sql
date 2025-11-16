-- Create custom types (if they don't exist)
DO $$ BEGIN
    CREATE TYPE conversation_status AS ENUM ('active', 'archived', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('message', 'offer', 'trade', 'meetup', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'push');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status conversation_status DEFAULT 'active',
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,
    unread_count_buyer INTEGER DEFAULT 0,
    unread_count_seller INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, buyer_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    attachment_url TEXT,
    location_data JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Message templates table (global templates)
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_text TEXT NOT NULL,
    category VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[],
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id, updated_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id, updated_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_conversations_item ON conversations(item_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, read_at) WHERE read_at IS NULL;

-- Insert default message templates
INSERT INTO message_templates (template_text, category, display_order, is_active) VALUES
('Is this still available?', 'availability', 1, TRUE),
('Can you do $[amount]?', 'price_negotiation', 2, TRUE),
('When can we meet?', 'meetup', 3, TRUE),
('Can I see more photos or a video?', 'availability', 4, TRUE),
('Would you trade for [item]?', 'trade', 5, TRUE),
('What''s the lowest you''ll go?', 'price_negotiation', 6, TRUE)
ON CONFLICT DO NOTHING;