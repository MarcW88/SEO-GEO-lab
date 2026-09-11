import { NextResponse } from 'next/server'
import { getExperiments, getCapabilities, getTools } from '@/lib/db'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase is not configured')
    }

    const [experiments, capabilities, tools] = await Promise.all([
      getExperiments(),
      getCapabilities(),
      getTools(),
    ])
    return NextResponse.json(
      { experiments, capabilities, tools },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('GET /api/data failed', error)
    return NextResponse.json(
      { error: 'The Lab data could not be loaded.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
