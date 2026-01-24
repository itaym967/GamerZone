-- Migration: Add message deletion support
-- This adds soft delete capability and automatic cleanup

-- Add deletion tracking fields to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS deleted_by text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Create index for faster deletion queries
CREATE INDEX IF NOT EXISTS idx_messages_deleted_by ON messages USING GIN (deleted_by);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);

-- Function to soft delete a message for a specific user
CREATE OR REPLACE FUNCTION soft_delete_message(
    message_id uuid,
    user_id text
)
RETURNS void AS $$
BEGIN
    UPDATE messages
    SET deleted_by = array_append(deleted_by, user_id)
    WHERE id = message_id
    AND NOT (user_id = ANY(deleted_by)); -- Prevent duplicates
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hard delete messages older than specified days
CREATE OR REPLACE FUNCTION cleanup_old_messages(days_to_keep integer DEFAULT 90)
RETURNS TABLE(deleted_count bigint) AS $$
DECLARE
    count_deleted bigint;
BEGIN
    WITH deleted AS (
        DELETE FROM messages
        WHERE created_at < NOW() - (days_to_keep || ' days')::interval
        RETURNING *
    )
    SELECT COUNT(*) INTO count_deleted FROM deleted;
    
    RETURN QUERY SELECT count_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete all messages in a conversation for a user (soft delete)
CREATE OR REPLACE FUNCTION clear_conversation(
    user_id_param text,
    other_user_id text
)
RETURNS void AS $$
BEGIN
    UPDATE messages
    SET deleted_by = array_append(deleted_by, user_id_param)
    WHERE (
        (sender_id = user_id_param AND receiver_id = other_user_id)
        OR (sender_id = other_user_id AND receiver_id = user_id_param)
    )
    AND NOT (user_id_param = ANY(deleted_by));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION soft_delete_message TO authenticated;
GRANT EXECUTE ON FUNCTION clear_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_messages TO service_role; -- Only service role can run cleanup

-- Add comment for documentation
COMMENT ON FUNCTION soft_delete_message IS 'Soft deletes a message for a specific user by adding them to deleted_by array';
COMMENT ON FUNCTION cleanup_old_messages IS 'Hard deletes messages older than specified days (default 90). Returns count of deleted messages.';
COMMENT ON FUNCTION clear_conversation IS 'Soft deletes all messages in a conversation for a specific user';
