-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user', -- admin, employer, maid
  language TEXT DEFAULT 'en', -- en, kannada, hindi, nepali
  status TEXT DEFAULT 'active', -- active, inactive, opted_out
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Templates Table
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- welcome, onboarding, salary_reminder, document_reminder, payment_reminder
  language TEXT NOT NULL, -- en, kannada, hindi, nepali
  content TEXT NOT NULL,
  subject TEXT,
  variables TEXT, -- JSON array of variables like {name}, {salary_amount}
  channel TEXT NOT NULL, -- whatsapp_text, whatsapp_voice, email
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Workflows Table
CREATE TABLE IF NOT EXISTS workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- onboarding, salary_reminder, document_collection, payment_reminder
  description TEXT,
  trigger_type TEXT NOT NULL, -- event, scheduled
  trigger_value TEXT, -- cron expression or event name
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Workflow Steps Table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  step_number INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- send_message, wait, check_response, escalate
  template_id INTEGER,
  wait_duration INTEGER, -- in seconds
  condition TEXT, -- JSON for conditional logic
  next_step_on_success INTEGER,
  next_step_on_failure INTEGER,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id),
  FOREIGN KEY (template_id) REFERENCES templates(id)
);

-- Create Workflow Instances Table
CREATE TABLE IF NOT EXISTS workflow_instances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'in_progress', -- in_progress, completed, failed, paused
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  channel TEXT NOT NULL, -- whatsapp_text, whatsapp_voice, email
  subject TEXT,
  content TEXT,
  status TEXT DEFAULT 'pending', -- pending, sent, failed, delivered, read
  scheduled_for DATETIME,
  sent_at DATETIME,
  error_message TEXT,
  workflow_instance_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (template_id) REFERENCES templates(id),
  FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id)
);

-- Create Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  workflow_instance_id INTEGER,
  message_type TEXT NOT NULL, -- outbound, inbound
  channel TEXT NOT NULL, -- whatsapp_text, whatsapp_voice, email
  content TEXT NOT NULL,
  language TEXT,
  detected_language TEXT,
  intent TEXT,
  sentiment TEXT, -- positive, neutral, negative, confused
  is_audio INTEGER DEFAULT 0,
  audio_url TEXT,
  status TEXT DEFAULT 'received', -- received, processed, responded
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id)
);

-- Create Intents Table
CREATE TABLE IF NOT EXISTS intents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL, -- completion, confusion, insurance_query, upi_question, smart_backup_request, opt_out, other
  description TEXT,
  response_template TEXT,
  escalation_required INTEGER DEFAULT 0
);

-- Create Analytics Table
CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  total_notifications_sent INTEGER DEFAULT 0,
  total_notifications_delivered INTEGER DEFAULT 0,
  total_notifications_failed INTEGER DEFAULT 0,
  total_conversations INTEGER DEFAULT 0,
  workflow_completions INTEGER DEFAULT 0,
  workflow_failures INTEGER DEFAULT 0,
  escalations INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default intents
INSERT OR IGNORE INTO intents (name, description, escalation_required) VALUES
('completion', 'User has completed the task', 0),
('confusion', 'User is confused and needs help', 1),
('insurance_query', 'User has questions about insurance', 1),
('upi_question', 'User has questions about UPI payment', 1),
('smart_backup_request', 'User requesting Smart Backup service', 0),
('opt_out', 'User wants to opt out from messages', 0),
('other', 'Other category', 0);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_templates_language ON templates(language);
