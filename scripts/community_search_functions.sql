-- =====================================================
-- COMMUNITY SEARCH FUNCTIONS
-- =====================================================

-- Function to search nearby restaurants with menu items
CREATE OR REPLACE FUNCTION search_nearby_restaurants(
  search_term TEXT,
  user_lat DECIMAL DEFAULT NULL,
  user_lng DECIMAL DEFAULT NULL,
  radius_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  restaurant_id UUID,
  restaurant_name TEXT,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  cuisine_type TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance DECIMAL,
  menu_items JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH matching_items AS (
    SELECT 
      cmi.*,
      rl.restaurant_name,
      rl.description as restaurant_description,
      rl.address,
      rl.phone,
      rl.email,
      rl.cuisine_type,
      rl.latitude,
      rl.longitude,
      rl.is_active
    FROM community_menu_items cmi
    JOIN restaurant_listings rl ON cmi.listing_id = rl.id
    WHERE cmi.is_available = true
      AND rl.is_active = true
      AND (
        cmi.name ILIKE '%' || search_term || '%' OR
        cmi.description ILIKE '%' || search_term || '%' OR
        EXISTS (
          SELECT 1 FROM unnest(COALESCE(cmi.tags, '{}')) AS tag
          WHERE tag ILIKE '%' || search_term || '%'
        )
      )
  ),
  restaurant_summary AS (
    SELECT 
      rl.id as restaurant_id,
      rl.restaurant_name,
      rl.description,
      rl.address,
      rl.phone,
      rl.email,
      rl.cuisine_type,
      rl.latitude,
      rl.longitude,
      CASE 
        WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL AND rl.latitude IS NOT NULL AND rl.longitude IS NOT NULL
        THEN (6371 * acos(cos(radians(user_lat)) * cos(radians(rl.latitude)) * cos(radians(user_lng - rl.longitude)) + sin(radians(user_lat)) * sin(radians(rl.latitude))))
        ELSE NULL
      END as distance,
      jsonb_agg(
        jsonb_build_object(
          'id', cmi.id,
          'name', cmi.name,
          'description', cmi.description,
          'price', cmi.price,
          'category', cmi.category,
          'preparation_time', cmi.preparation_time,
          'tags', cmi.tags
        )
      ) as menu_items
    FROM restaurant_listings rl
    JOIN community_menu_items cmi ON rl.id = cmi.listing_id
    WHERE rl.id IN (SELECT listing_id FROM matching_items)
      AND cmi.is_available = true
    GROUP BY rl.id, rl.restaurant_name, rl.description, rl.address, rl.phone, rl.email, rl.cuisine_type, rl.latitude, rl.longitude
  )
  SELECT * FROM restaurant_summary
  WHERE distance IS NULL OR distance <= radius_km
  ORDER BY distance ASC NULLS LAST, restaurant_name ASC;
END;
$$;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
AS $$
  SELECT COUNT(*)::INTEGER
  FROM restaurant_messages
  WHERE receiver_id = user_uuid AND is_read = false;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(user_uuid UUID, other_user_uuid UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE sql
AS $$
  UPDATE restaurant_messages
  SET is_read = true
  WHERE receiver_id = user_uuid
    AND is_read = false
    AND (other_user_uuid IS NULL OR sender_id = other_user_uuid);
$$;
