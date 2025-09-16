-- =====================================================
-- CLEAN MIGRATION: Convert Messages to Conversation-Based Structure
-- =====================================================
-- This script migrates existing restaurant_messages to the new conversation structure
-- Run this AFTER running alter_messages_table.sql

-- Step 1: Clean up test messages (self-messages) - DELETE THEM
DELETE FROM public.restaurant_messages 
WHERE sender_id = receiver_id;

-- Step 2: Temporarily allow NULL conversation_id
ALTER TABLE public.restaurant_messages ALTER COLUMN conversation_id DROP NOT NULL;

-- Step 3: Create conversations for existing message pairs (only valid pairs)
INSERT INTO public.restaurant_conversations (restaurant_a_id, restaurant_b_id, created_at, updated_at)
SELECT DISTINCT
    CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END as restaurant_a_id,
    CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END as restaurant_b_id,
    MIN(created_at) as created_at,
    MAX(created_at) as updated_at
FROM public.restaurant_messages
WHERE sender_id IS NOT NULL AND receiver_id IS NOT NULL
GROUP BY 
    CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
    CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END
ON CONFLICT (restaurant_a_id, restaurant_b_id) DO NOTHING;

-- Step 4: Update existing messages to reference conversations
UPDATE public.restaurant_messages 
SET conversation_id = rc.id
FROM public.restaurant_conversations rc
WHERE conversation_id IS NULL
    AND (
        (restaurant_messages.sender_id = rc.restaurant_a_id AND restaurant_messages.receiver_id = rc.restaurant_b_id) OR
        (restaurant_messages.sender_id = rc.restaurant_b_id AND restaurant_messages.receiver_id = rc.restaurant_a_id)
    );

-- Step 5: Update conversation timestamps
UPDATE public.restaurant_conversations 
SET updated_at = (
    SELECT MAX(created_at) 
    FROM public.restaurant_messages 
    WHERE conversation_id = restaurant_conversations.id
);

-- Step 6: Check for any messages without conversation_id (should be 0)
SELECT COUNT(*) as messages_without_conversation 
FROM public.restaurant_messages 
WHERE conversation_id IS NULL;

-- Step 7: Since all messages are linked, make conversation_id NOT NULL
ALTER TABLE public.restaurant_messages ALTER COLUMN conversation_id SET NOT NULL;

COMMIT;