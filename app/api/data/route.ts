import { NextResponse } from 'next/server'
import { getExperiments, getCapabilities } from '@/lib/db'

export async function GET() {
  const [experiments, capabilities] = await Promise.all([getExperiments(), getCapabilities()])
  return NextResponse.json({ experiments, capabilities })
}
