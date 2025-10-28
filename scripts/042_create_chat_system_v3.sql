-- Clean up existing objects
DROP TRIGGER IF EXISTS update_conversation_on_message ON chat_messages CASCADE;
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;

-- Create chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_conversation_farmer FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_agent FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT unique_farmer_agent UNIQUE(farmer_id, agent_id)
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_type VARCHAR(20) NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  content TEXT,
  image_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_sender_type CHECK (sender_type IN ('farmer', 'agent')),
  CONSTRAINT check_message_type CHECK (message_type IN ('text', 'image')),
  CONSTRAINT check_message_content CHECK (
    (message_type = 'text' AND content IS NOT NULL) OR
    (message_type = 'image' AND image_url IS NOT NULL)
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_farmer ON chat_conversations(farmer_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_agent ON chat_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_org ON chat_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON chat_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON chat_messages(is_read) WHERE is_read = FALSE;

-- Enable Row Level Security
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Agents can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view their conversations"
  ON chat_conversations FOR SELECT
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = chat_conversations.farmer_id 
      AND farmers.user_id = auth.uid()
    )
  );

CREATE POLICY "Agents can create conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Farmers can create conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = chat_conversations.farmer_id 
      AND farmers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their conversations"
  ON chat_conversations FOR UPDATE
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM farmers 
      WHERE farmers.id = chat_conversations.farmer_id 
      AND farmers.user_id = auth.uid()
    )
  );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their conversations"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (
        chat_conversations.agent_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM farmers 
          WHERE farmers.id = chat_conversations.farmer_id 
          AND farmers.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND (
        chat_conversations.agent_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM farmers 
          WHERE farmers.id = chat_conversations.farmer_id 
          AND farmers.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own messages"
  ON chat_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Function to update conversation timestamp when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update conversation timestamp
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chat_messages TO authenticated;
