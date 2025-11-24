import Database from "better-sqlite3"
import path from "path"

let db: Database.Database | null = null

export function getDb() {
  if (!db) {
    // Persistent SQLite database saved as gharpey.db
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), "gharpey.db")

    db = new Database(dbPath)
    db.pragma("journal_mode = WAL") // better concurrency + crash safety
  }
  return db
}

export function initializeDatabase() {
  const db = getDb()

  // Check if tables already exist (if yes, skip creation & seeding)
  const tableCheck = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    .get()

  if (tableCheck) return

  const initScript = `
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'user',
      language TEXT DEFAULT 'en',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      language TEXT NOT NULL,
      content TEXT NOT NULL,
      subject TEXT,
      variables TEXT,
      channel TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      trigger_type TEXT NOT NULL,
      trigger_value TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE workflow_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      template_id INTEGER,
      wait_duration INTEGER,
      condition TEXT,
      next_step_on_success INTEGER,
      next_step_on_failure INTEGER,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id),
      FOREIGN KEY (template_id) REFERENCES templates(id)
    );

    CREATE TABLE workflow_instances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      current_step INTEGER DEFAULT 1,
      status TEXT DEFAULT 'in_progress',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      template_id INTEGER NOT NULL,
      channel TEXT NOT NULL,
      subject TEXT,
      content TEXT,
      status TEXT DEFAULT 'pending',
      scheduled_for DATETIME,
      sent_at DATETIME,
      error_message TEXT,
      workflow_instance_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (template_id) REFERENCES templates(id),
      FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id)
    );

    CREATE TABLE conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      workflow_instance_id INTEGER,
      message_type TEXT NOT NULL,
      channel TEXT NOT NULL,
      content TEXT NOT NULL,
      language TEXT,
      detected_language TEXT,
      intent TEXT,
      sentiment TEXT,
      is_audio INTEGER DEFAULT 0,
      audio_url TEXT,
      status TEXT DEFAULT 'received',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id)
    );

    CREATE TABLE intents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      response_template TEXT,
      escalation_required INTEGER DEFAULT 0
    );

    CREATE TABLE analytics (
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

    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_phone ON users(phone);
    CREATE INDEX idx_notifications_user ON notifications(user_id);
    CREATE INDEX idx_notifications_status ON notifications(status);
    CREATE INDEX idx_conversations_user ON conversations(user_id);
    CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);
    CREATE INDEX idx_templates_language ON templates(language);
  `

  db.exec(initScript)
  seedDatabase(db)
}

function seedDatabase(db: Database.Database) {
  try {
    const userStmt = db.prepare(
      "INSERT INTO users (name, email, phone, role, language, status) VALUES (?, ?, ?, ?, ?, ?)"
    )
    userStmt.run("John Employer", "employer@gharpey.com", "9876543210", "employer", "en", "active")
    userStmt.run("Sarah Maid", "maid@gharpey.com", "9123456789", "employee", "hi", "active")
    userStmt.run("Admin User", "admin@gharpey.com", "8765432109", "admin", "en", "active")

    const templateStmt = db.prepare(
      "INSERT INTO templates (name, type, language, content, channel, subject) VALUES (?, ?, ?, ?, ?, ?)"
    )
    templateStmt.run("Welcome", "welcome", "en",
      "Welcome to GharPey! We are excited to have you. Please complete your profile.",
      "whatsapp", null)

    templateStmt.run("Welcome (Hindi)", "welcome", "hi",
      "GharPey में आपका स्वागत है! हम आपके साथ काम करने के लिए उत्साहित हैं।",
      "whatsapp", null)

    templateStmt.run("Salary Reminder", "salary_reminder", "en",
      "Your salary will be credited on the 5th of this month.",
      "whatsapp", null)

    templateStmt.run("Salary Reminder (Hindi)", "salary_reminder", "hi",
      "आपका वेतन इस महीने की 5 तारीख को जमा किया जाएगा।",
      "whatsapp", null)

    templateStmt.run("Document Request", "document_request", "en",
      "Please upload your documents to complete verification.",
      "email", "Document Verification Required")

    templateStmt.run("Payment Support", "payment_support", "en",
      "We are here to help with your payment questions.",
      "voice", null)

    const workflowStmt = db.prepare(
      "INSERT INTO workflows (name, type, description, trigger_type, trigger_value, is_active) VALUES (?, ?, ?, ?, ?, ?)"
    )
    workflowStmt.run("Onboarding", "onboarding", "Welcome and profile completion",
      "user_signup", "new_user", 1)

    workflowStmt.run("Salary Reminder", "salary_reminder",
      "Monthly salary credit notification", "scheduled", "5th_of_month", 1)

    workflowStmt.run("Document Collection", "document_collection",
      "Collect verification documents", "manual", "admin_trigger", 1)

    const stepStmt = db.prepare(
      "INSERT INTO workflow_steps (workflow_id, step_number, action_type, template_id, wait_duration) VALUES (?, ?, ?, ?, ?)"
    )
    stepStmt.run(1, 1, "send_message", 1, 0)
    stepStmt.run(1, 2, "wait", null, 3600)
    stepStmt.run(2, 1, "send_message", 3, 0)
    stepStmt.run(3, 1, "send_message", 5, 0)
  } catch (error) {
    console.log("[v0] Database seed error:", error)
  }
}
