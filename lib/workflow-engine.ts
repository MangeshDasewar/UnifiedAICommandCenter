import { getDb, initializeDatabase } from "./db"

export interface WorkflowStep {
  id: number
  workflow_id: number
  step_number: number
  action_type: "send_message" | "wait" | "check_response" | "escalate"
  template_id?: number
  wait_duration?: number
  condition?: string
  next_step_on_success?: number
  next_step_on_failure?: number
}

export interface WorkflowInstance {
  id: number
  workflow_id: number
  user_id: number
  current_step: number
  status: "in_progress" | "completed" | "failed" | "paused"
  started_at: string
  completed_at?: string
}

export class WorkflowEngine {
  private db: any

  constructor() {
    initializeDatabase()
    this.db = getDb()
  }

  // Start a new workflow for a user
  startWorkflow(workflowId: number, userId: number): WorkflowInstance {
    const stmt = this.db.prepare(
      "INSERT INTO workflow_instances (workflow_id, user_id, current_step, status) VALUES (?, ?, 1, ?)",
    )
    const result = stmt.run(workflowId, userId, "in_progress")

    return {
      id: result.lastInsertRowid as number,
      workflow_id: workflowId,
      user_id: userId,
      current_step: 1,
      status: "in_progress",
      started_at: new Date().toISOString(),
    }
  }

  // Get workflow instance
  getWorkflowInstance(instanceId: number): WorkflowInstance | null {
    const stmt = this.db.prepare("SELECT * FROM workflow_instances WHERE id = ?")
    return (stmt.get(instanceId) as WorkflowInstance) || null
  }

  // Get workflow steps
  getWorkflowSteps(workflowId: number): WorkflowStep[] {
    const stmt = this.db.prepare("SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_number")
    return stmt.all(workflowId) as WorkflowStep[]
  }

  // Get next step
  getNextStep(workflowId: number, stepNumber: number): WorkflowStep | null {
    const stmt = this.db.prepare("SELECT * FROM workflow_steps WHERE workflow_id = ? AND step_number = ?")
    return (stmt.get(workflowId, stepNumber) as WorkflowStep) || null
  }

  // Execute workflow step
  async executeStep(instance: WorkflowInstance, step: WorkflowStep): Promise<boolean> {
    try {
      switch (step.action_type) {
        case "send_message":
          return this.sendMessageStep(instance, step)
        case "wait":
          return this.waitStep(instance, step)
        case "check_response":
          return this.checkResponseStep(instance, step)
        case "escalate":
          return this.escalateStep(instance, step)
        default:
          return false
      }
    } catch (error) {
      console.error("[v0] Error executing workflow step:", error)
      return false
    }
  }

  // Send message step
  private sendMessageStep(instance: WorkflowInstance, step: WorkflowStep): boolean {
    if (!step.template_id) return false

    const templateStmt = this.db.prepare("SELECT * FROM templates WHERE id = ?")
    const template = templateStmt.get(step.template_id) as any
    if (!template) return false

    const userStmt = this.db.prepare("SELECT * FROM users WHERE id = ?")
    const user = userStmt.get(instance.user_id) as any
    if (!user) return false

    // Create notification
    const notifStmt = this.db.prepare(
      "INSERT INTO notifications (user_id, template_id, channel, content, status, workflow_instance_id) VALUES (?, ?, ?, ?, ?, ?)",
    )
    notifStmt.run(instance.user_id, step.template_id, template.channel, template.content, "sent", instance.id)

    console.log(`[v0] Sent message to user ${instance.user_id} via ${template.channel}`)
    return true
  }

  // Wait step
  private waitStep(instance: WorkflowInstance, step: WorkflowStep): boolean {
    const waitDuration = step.wait_duration || 3600 // Default 1 hour
    console.log(`[v0] Workflow instance ${instance.id} waiting for ${waitDuration}s`)
    return true
  }

  // Check response step
  private checkResponseStep(instance: WorkflowInstance, step: WorkflowStep): boolean {
    const convStmt = this.db.prepare(
      "SELECT * FROM conversations WHERE workflow_instance_id = ? AND message_type = ? ORDER BY created_at DESC LIMIT 1",
    )
    const latestConv = convStmt.get(instance.id, "inbound") as any

    if (!latestConv) {
      console.log(`[v0] No response found for workflow instance ${instance.id}`)
      return false
    }

    console.log(`[v0] Response received: ${latestConv.intent}`)
    return true
  }

  // Escalate step
  private escalateStep(instance: WorkflowInstance, step: WorkflowStep): boolean {
    const updateStmt = this.db.prepare("UPDATE workflow_instances SET status = ? WHERE id = ?")
    updateStmt.run("paused", instance.id)

    console.log(`[v0] Workflow instance ${instance.id} escalated for manual review`)
    return false
  }

  // Progress workflow
  progressWorkflow(instance: WorkflowInstance, success: boolean): WorkflowInstance | null {
    const step = this.getNextStep(instance.workflow_id, instance.current_step)
    if (!step) {
      this.completeWorkflow(instance.id)
      return this.getWorkflowInstance(instance.id)
    }

    const nextStepNumber = success
      ? step.next_step_on_success || step.step_number + 1
      : step.next_step_on_failure || step.step_number + 1

    const updateStmt = this.db.prepare("UPDATE workflow_instances SET current_step = ? WHERE id = ?")
    updateStmt.run(nextStepNumber, instance.id)

    return this.getWorkflowInstance(instance.id)
  }

  // Complete workflow
  private completeWorkflow(instanceId: number): void {
    const updateStmt = this.db.prepare("UPDATE workflow_instances SET status = ?, completed_at = ? WHERE id = ?")
    updateStmt.run("completed", new Date().toISOString(), instanceId)
    console.log(`[v0] Workflow instance ${instanceId} completed`)
  }

  // Get active workflows
  getActiveWorkflows(): WorkflowInstance[] {
    const stmt = this.db.prepare("SELECT * FROM workflow_instances WHERE status = 'in_progress' LIMIT 100")
    return stmt.all() as WorkflowInstance[]
  }

  // Seed sample workflows
  seedWorkflows(): void {
    try {
      // Check if workflows already exist
      const countStmt = this.db.prepare("SELECT COUNT(*) as count FROM workflows")
      const result = (countStmt.get() as any).count

      if (result > 0) return // Already seeded

      // Onboarding workflow
      const workflowStmt = this.db.prepare(
        "INSERT INTO workflows (name, type, description, trigger_type, is_active) VALUES (?, ?, ?, ?, ?)",
      )

      const onboardingId = workflowStmt.run(
        "User Onboarding",
        "onboarding",
        "Welcome and document collection workflow",
        "event",
        1,
      ).lastInsertRowid as number

      // Salary reminder workflow
      const salaryId = workflowStmt.run(
        "Salary Reminder",
        "salary_reminder",
        "Monthly salary notification workflow",
        "scheduled",
        1,
      ).lastInsertRowid as number

      // Create templates for workflows
      const templateStmt = this.db.prepare(
        "INSERT INTO templates (name, type, language, content, variables, channel) VALUES (?, ?, ?, ?, ?, ?)",
      )

      templateStmt.run(
        "Welcome Message EN",
        "welcome",
        "en",
        "Welcome to GharPey, {name}! We are excited to have you. Please complete your profile by uploading required documents.",
        JSON.stringify(["{name}"]),
        "whatsapp_text",
      )

      templateStmt.run(
        "Salary Reminder EN",
        "salary_reminder",
        "en",
        "Hi {name}, your salary of ₹{amount} will be credited on {due_date}. If you have any questions, reach out to us.",
        JSON.stringify(["{name}", "{amount}", "{due_date}"]),
        "whatsapp_text",
      )

      console.log("[v0] Workflows seeded successfully")
    } catch (error) {
      console.error("[v0] Error seeding workflows:", error)
    }
  }
}
