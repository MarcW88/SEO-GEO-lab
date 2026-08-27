import { NextResponse } from 'next/server'
import { getExperiments, getCapabilities, getTools } from '@/lib/db'

export async function GET() {
  const [experiments, capabilities, tools] = await Promise.all([
    getExperiments(),
    getCapabilities(),
    getTools(),
  ])
  return NextResponse.json({ experiments, capabilities, tools })
}
