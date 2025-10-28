-- Drop existing objects in correct order
DROP TRIGGER IF EXISTS update_conversation_on_message ON chat_messages CASCADE;
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;

-- Create chat conversations table
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(farmer_id, agent_id)
);

-- Create chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('farmer', 'agent')),
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image')),
  content TEXT,
  image_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (
    (message_type = 'text' AND content IS NOT NULL) OR
    (message_type = 'image' AND image_url IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX idx_chat_conversations_farmer ON chat_conversations(farmer_id);
CREATE INDEX idx_chat_conversations_agent ON chat_conversations(agent_id);
CREATE INDEX idx_chat_conversations_org ON chat_conversations(organization_id);
CREATE INDEX idx_chat_conversations_last_message ON chat_conversations(last_message_at DESC);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_unread ON chat_messages(is_read) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for chat_conversations
CREATE POLICY "Users can view their own conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    farmer_id IN (SELECT id FROM farmers WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = auth.uid() OR
    farmer_id IN (SELECT id FROM farmers WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    farmer_id IN (SELECT id FROM farmers WHERE user_id = auth.uid())
  );

-- Simple RLS policies for chat_messages
CREATE POLICY "Users can view messages in their conversations"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE agent_id = auth.uid() OR
      farmer_id IN (SELECT id FROM farmers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE agent_id = auth.uid() OR
      farmer_id IN (SELECT id FROM farmers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversation timestamp
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_messages TO authenticated;
