-- Create tasks table for farmer task assignments
CREATE TABLE IF NOT EXISTS farmer_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_to_agent UUID REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_farmer_tasks_farmer ON farmer_tasks(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_tasks_agent ON farmer_tasks(assigned_to_agent);
CREATE INDEX IF NOT EXISTS idx_farmer_tasks_org ON farmer_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_farmer_tasks_status ON farmer_tasks(status);

-- Enable RLS
ALTER TABLE farmer_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view tasks in their organization"
  ON farmer_tasks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can create tasks"
  ON farmer_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND organization_id = farmer_tasks.organization_id
      AND role IN ('admin', 'manager', 'super_admin')
    )
  );

CREATE POLICY "Admins and managers can update tasks"
  ON farmer_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND organization_id = farmer_tasks.organization_id
      AND role IN ('admin', 'manager', 'super_admin')
    )
  );

-- Extension agents can update task status
CREATE POLICY "Agents can update assigned tasks"
  ON farmer_tasks FOR UPDATE
  USING (assigned_to_agent = auth.uid());

-- Create function to notify agents when tasks are assigned
CREATE OR REPLACE FUNCTION notify_agent_of_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to_agent IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type)
    VALUES (
      NEW.assigned_to_agent,
      'New Task Assigned',
      'You have been assigned a new task: ' || NEW.title,
      'task_assigned',
      NEW.id::TEXT,
      'farmer_task'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_assignment_notification
  AFTER INSERT ON farmer_tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_agent_of_task();
