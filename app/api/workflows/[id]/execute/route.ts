import { type NextRequest, NextResponse } from "next/server"
import { WorkflowEngine } from "@/lib/workflow-engine"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const engine = new WorkflowEngine()
    const instanceId = Number.parseInt(params.id)

    const instance = engine.getWorkflowInstance(instanceId)
    if (!instance) {
      return NextResponse.json({ error: "Workflow instance not found" }, { status: 404 })
    }

    const step = engine.getNextStep(instance.workflow_id, instance.current_step)
    if (!step) {
      return NextResponse.json({ error: "No more steps in workflow" }, { status: 400 })
    }

    const success = await engine.executeStep(instance, step)
    const updatedInstance = engine.progressWorkflow(instance, success)

    return NextResponse.json({
      instance: updatedInstance,
      step_executed: step.step_number,
      success,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
