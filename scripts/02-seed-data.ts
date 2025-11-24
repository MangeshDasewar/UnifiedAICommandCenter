import { getDb, initializeDatabase } from "@/lib/db"
import { WorkflowEngine } from "@/lib/workflow-engine"

export function seedData() {
  try {
    initializeDatabase()
    const db = getDb()

    // Seed default intents (already done in init)

    // Seed users
    const userStmt = db.prepare(
      "INSERT OR IGNORE INTO users (name, email, phone, role, language, status) VALUES (?, ?, ?, ?, ?, ?)",
    )

    userStmt.run("Rajesh Kumar", "rajesh@example.com", "+91 9876543210", "employer", "en", "active")
    userStmt.run("Priya Singh", "priya@example.com", "+91 8765432109", "maid", "hi", "active")
    userStmt.run("Arjun Patel", "arjun@example.com", "+91 7654321098", "employer", "en", "active")

    // Seed templates
    const templateStmt = db.prepare(
      "INSERT OR IGNORE INTO templates (name, type, language, content, subject, variables, channel) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )

    const templates = [
      {
        name: "Welcome Message",
        type: "welcome",
        language: "en",
        content:
          "Welcome to GharPey, {name}! We are excited to have you. Please complete your profile by uploading required documents.",
        subject: "Welcome to GharPey",
        variables: JSON.stringify(["{name}"]),
        channel: "whatsapp_text",
      },
      {
        name: "Salary Reminder",
        type: "salary_reminder",
        language: "en",
        content:
          "Hi {name}, your salary of ₹{amount} will be credited on {due_date}. If you have any questions, reach out to us.",
        subject: "Salary Reminder",
        variables: JSON.stringify(["{name}", "{amount}", "{due_date}"]),
        channel: "email",
      },
      {
        name: "Document Request",
        type: "document_reminder",
        language: "en",
        content: "Dear {name}, please upload your {document_type} within {days} days to keep your profile updated.",
        subject: "Document Upload Required",
        variables: JSON.stringify(["{name}", "{document_type}", "{days}"]),
        channel: "whatsapp_text",
      },
    ]

    templates.forEach((t) => {
      templateStmt.run(t.name, t.type, t.language, t.content, t.subject, t.variables, t.channel)
    })

    // Seed workflows
    const engine = new WorkflowEngine()
    engine.seedWorkflows()

    console.log("[v0] Data seeding completed successfully")
  } catch (error) {
    console.error("[v0] Error seeding data:", error)
  }
}

// Run seeding
seedData()
