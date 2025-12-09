-- Add is_group column to chat_messages table to support group chat functionality
ALTER TABLE t_p24058207_website_creation_pro.chat_messages 
ADD COLUMN is_group BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for efficient querying of group messages
CREATE INDEX idx_chat_messages_is_group ON t_p24058207_website_creation_pro.chat_messages(is_group) WHERE is_group = TRUE;