-- =====================================================
-- SIMPLE COMMUNITY SEARCH SCHEMA
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Restaurant Listings Table
CREATE TABLE IF NOT EXISTS public.restaurant_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  cuisine_type TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Community Menu Items
CREATE TABLE IF NOT EXISTS public.community_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.restaurant_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10, 2),
  preparation_time INTEGER, -- in minutes
  tags TEXT[],
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Restaurant Conversations (NEW)
CREATE TABLE IF NOT EXISTS public.restaurant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_a_id, restaurant_b_id),
  CHECK (restaurant_a_id < restaurant_b_id) -- Ensures consistent ordering
);

-- 4. Restaurant Messages (UPDATED)
CREATE TABLE IF NOT EXISTS public.restaurant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.restaurant_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_listings_user_id ON public.restaurant_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_listings_active ON public.restaurant_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurant_listings_location ON public.restaurant_listings(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_menu_items_listing_id ON public.community_menu_items(listing_id);
CREATE INDEX IF NOT EXISTS idx_community_menu_items_available ON public.community_menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_community_menu_items_tags ON public.community_menu_items USING GIN (tags);
-- Updated message indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_conversations_participants ON public.restaurant_conversations(restaurant_a_id, restaurant_b_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_messages_conversation_id ON public.restaurant_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_messages_sender ON public.restaurant_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_messages_created_at ON public.restaurant_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_restaurant_messages_unread ON public.restaurant_messages(conversation_id, is_read) WHERE is_read = false;
-- Enable RLS
ALTER TABLE public.restaurant_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_messages ENABLE ROW LEVEL SECURITY;
-- RLS Policies (with safe creation)
DO $$
BEGIN
    -- Restaurant listings policies
    BEGIN
        CREATE POLICY "restaurant_listings_select_all" ON public.restaurant_listings FOR SELECT USING (true);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy restaurant_listings_select_all already exists, skipping...';
    END;

    BEGIN
        CREATE POLICY "restaurant_listings_insert_own" ON public.restaurant_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy restaurant_listings_insert_own already exists, skipping...';
    END;

    BEGIN
        CREATE POLICY "restaurant_listings_update_own" ON public.restaurant_listings FOR UPDATE USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy restaurant_listings_update_own already exists, skipping...';
    END;

    BEGIN
        CREATE POLICY "restaurant_listings_delete_own" ON public.restaurant_listings FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy restaurant_listings_delete_own already exists, skipping...';
    END;

    -- Community menu items policies
    BEGIN
        CREATE POLICY "community_menu_items_select_all" ON public.community_menu_items FOR SELECT USING (true);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy community_menu_items_select_all already exists, skipping...';
    END;

    BEGIN
        CREATE POLICY "community_menu_items_insert_own" ON public.community_menu_items FOR INSERT WITH CHECK (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy community_menu_items_insert_own already exists, skipping...';
    END;

    BEGIN
        CREATE POLICY "community_menu_items_update_own" ON public.community_menu_items FOR UPDATE USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy community_menu_items_update_own already exists, skipping...';
    END;

    BEGIN
        CREATE POLICY "community_menu_items_delete_own" ON public.community_menu_items FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy community_menu_items_delete_own already exists, skipping...';
    END;

       -- Restaurant conversations policies
    BEGIN
        CREATE POLICY "restaurant_conversations_select_own" ON public.restaurant_conversations FOR SELECT 
        USING (auth.uid() = restaurant_a_id OR auth.uid() = restaurant_b_id);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy restaurant_conversations_select_own already exists, skipping...';
    END;

    BEGIN
        CREATE POLICY "restaurant_conversations_insert_own" ON public.restaurant_conversations FOR INSERT 
        WITH CHECK (auth.uid() = restaurant_a_id OR auth.uid() = restaurant_b_id);
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy restaurant_conversations_insert_own already exists, skipping...';
    END;

    -- Restaurant messages policies (updated)
    BEGIN
        CREATE POLICY "restaurant_messages_select_own" ON public.restaurant_messages FOR SELECT 
        USING (EXISTS (
            SELECT 1 FROM public.restaurant_conversations rc 
            WHERE rc.id = restaurant_messages.conversation_id 
            AND (rc.restaurant_a_id = auth.uid() OR rc.restaurant_b_id = auth.uid())
        ));
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy restaurant_messages_select_own already exists, skipping...';
    END;

    BEGIN
        CREATE POLICY "restaurant_messages_insert_own" ON public.restaurant_messages FOR INSERT 
        WITH CHECK (
            auth.uid() = sender_id AND 
            EXISTS (
                SELECT 1 FROM public.restaurant_conversations rc 
                WHERE rc.id = restaurant_messages.conversation_id 
                AND (rc.restaurant_a_id = auth.uid() OR rc.restaurant_b_id = auth.uid())
            )
        );
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Policy restaurant_messages_insert_own already exists, skipping...';
    END;

    BEGIN
        CREATE POLICY "restaurant_messages_update_own" ON public.restaurant_messages FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM public.restaurant_conversations rc 
                WHERE rc.id = restaurant_messages.conversation_id 
                AND (rc.restaurant_a_id = auth.uid() OR rc.restaurant_b_id = auth.uid())
            )
        );
    EXCEPTION
        WHEN duplicate_object THEN
                      RAISE NOTICE 'Policy restaurant_messages_update_own already exists, skipping...';
    END;

END $$;

-- Trigger for updated_at (with safe creation)
DO $$
BEGIN
    BEGIN
        CREATE TRIGGER update_restaurant_listings_updated_at BEFORE UPDATE ON public.restaurant_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Trigger update_restaurant_listings_updated_at already exists, skipping...';
    END;

    BEGIN
        CREATE TRIGGER update_community_menu_items_updated_at BEFORE UPDATE ON public.community_menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Trigger update_community_menu_items_updated_at already exists, skipping...';
    END;

    BEGIN
        CREATE TRIGGER update_restaurant_conversations_updated_at BEFORE UPDATE ON public.restaurant_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Trigger update_restaurant_conversations_updated_at already exists, skipping...';
    END;

END $$;
