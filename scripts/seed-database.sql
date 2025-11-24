-- Create tables for Unified AI Command Centre

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  role VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  description TEXT,
  trigger_event VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workflow instances table
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id),
  user_id UUID REFERENCES users(id),
  current_step INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  channel VARCHAR(50),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  content TEXT NOT NULL,
  variables TEXT,
  languages TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  message_type VARCHAR(20),
  channel VARCHAR(50),
  direction VARCHAR(20),
  language_detected VARCHAR(10),
  intent VARCHAR(100),
  sentiment VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (name, phone, role, language) VALUES
('Rajesh Kumar', '+91 9876543210', 'Employer', 'en'),
('Priya Singh', '+91 8765432109', 'Maid', 'hi'),
('Arjun Patel', '+91 7654321098', 'Employer', 'en')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO templates (name, category, content, languages) VALUES
('Welcome Message', 'Onboarding', 'Welcome to GharPey! We are excited to have {name} as part of our community.', 'en,hi,ka,ne'),
('Salary Reminder', 'Payment', 'Hi {name}, your salary of ₹{amount} will be credited on {due_date}.', 'en,hi,ka,ne'),
('Document Collection', 'Documents', 'Dear {name}, please upload your {document_type} within {days} days.', 'en,hi')
ON CONFLICT DO NOTHING;
