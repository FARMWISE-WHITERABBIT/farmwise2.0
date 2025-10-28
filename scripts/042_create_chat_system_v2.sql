-- Drop existing tables if they exist (for clean recreation)
DROP TRIGGER IF EXISTS update_conversation_on_message ON chat_messages;
DROP FUNCTION IF EXISTS update_conversation_timestamp();
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_conversations;

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
  CONSTRAINT message_content_check CHECK (
    (message_type = 'text' AND content IS NOT NULL) OR
    (message_type = 'image' AND image_url IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX idx_chat_conversations_farmer ON chat_conversations(farmer_id);
CREATE INDEX idx_chat_conversations_agent ON chat_conversations(agent_id);
CREATE INDEX idx_chat_conversations_org ON chat_conversations(organization_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations"
  ON chat_conversations FOR SELECT
  USING (
    agent_id::uuid = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = chat_conversations.farmer_id 
      AND farmers.user_id::uuid = auth.uid()::uuid
    )
  );

CREATE POLICY "Agents can create conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (agent_id::uuid = auth.uid()::uuid);

CREATE POLICY "Users can update their conversations"
  ON chat_conversations FOR UPDATE
  USING (
    agent_id::uuid = auth.uid()::uuid OR
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = chat_conversations.farmer_id 
      AND farmers.user_id::uuid = auth.uid()::uuid
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (
        chat_conversations.agent_id::uuid = auth.uid()::uuid OR
        EXISTS (
          SELECT 1 FROM farmers 
          WHERE farmers.id = chat_conversations.farmer_id 
          AND farmers.user_id::uuid = auth.uid()::uuid
        )
      )
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id::uuid = auth.uid()::uuid AND
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (
        chat_conversations.agent_id::uuid = auth.uid()::uuid OR
        EXISTS (
          SELECT 1 FROM farmers 
          WHERE farmers.id = chat_conversations.farmer_id 
          AND farmers.user_id::uuid = auth.uid()::uuid
        )
      )
    )
  );

CREATE POLICY "Users can update their own messages"
  ON chat_messages FOR UPDATE
  USING (sender_id::uuid = auth.uid()::uuid);

-- Function to update last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
