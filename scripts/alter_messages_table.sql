-- =====================================================
-- PRE-MIGRATION: Create Conversations Table & Alter Messages
-- =====================================================

-- Step 1: Create the restaurant_conversations table FIRST
CREATE TABLE IF NOT EXISTS public.restaurant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_a_id, restaurant_b_id),
  CHECK (restaurant_a_id < restaurant_b_id) -- Ensures consistent ordering
);

-- Step 2: Add conversation_id column to existing messages table
ALTER TABLE public.restaurant_messages ADD COLUMN IF NOT EXISTS conversation_id UUID;

-- Step 3: Add foreign key constraint (after column exists)
ALTER TABLE public.restaurant_messages 
ADD CONSTRAINT fk_restaurant_messages_conversation 
FOREIGN KEY (conversation_id) 
REFERENCES public.restaurant_conversations(id) 
ON DELETE CASCADE;

-- Step 4: Enable RLS on conversations table
ALTER TABLE public.restaurant_conversations ENABLE ROW LEVEL SECURITY;

-- Step 5: Add basic RLS policy for conversations
CREATE POLICY "restaurant_conversations_select_own" ON public.restaurant_conversations FOR SELECT 
USING (auth.uid() = restaurant_a_id OR auth.uid() = restaurant_b_id);

CREATE POLICY "restaurant_conversations_insert_own" ON public.restaurant_conversations FOR INSERT 
WITH CHECK (auth.uid() = restaurant_a_id OR auth.uid() = restaurant_b_id);