import { type NextRequest, NextResponse } from "next/server"
import { WorkflowEngine } from "@/lib/workflow-engine"

export async function POST(request: NextRequest) {
  try {
    const engine = new WorkflowEngine()
    const { workflowId, userId } = await request.json()

    if (!workflowId || !userId) {
      return NextResponse.json({ error: "Missing workflowId or userId" }, { status: 400 })
    }

    const instance = engine.startWorkflow(workflowId, userId)
    return NextResponse.json(instance, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
