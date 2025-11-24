import { NextResponse } from "next/server"
import { WorkflowEngine } from "@/lib/workflow-engine"

export async function GET() {
  try {
    const engine = new WorkflowEngine()
    const instances = engine.getActiveWorkflows()
    return NextResponse.json(instances)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
