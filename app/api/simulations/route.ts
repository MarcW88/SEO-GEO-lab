import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function getSB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET() {
  const sb = getSB()
  if (!sb) return NextResponse.json({ simulations: [] }, { headers: CORS })
  const { data } = await sb
    .from('simulations')
    .select('*, simulation_nodes(*), simulation_edges(*)')
    .order('created_at', { ascending: false })
  return NextResponse.json({ simulations: data ?? [] }, { headers: CORS })
}

export async function POST(req: NextRequest) {
  const sb = getSB()
  if (!sb) return NextResponse.json({ error: 'No DB connection' }, { status: 500, headers: CORS })

  const body = await req.json()
  const { name, hypothesis, expected_value, notes, nodes, edges } = body

  const simId = `sim-${Date.now()}`

  const { error: simErr } = await sb.from('simulations').insert({
    id: simId,
    name: name || 'Untitled Simulation',
    hypothesis: hypothesis || null,
    expected_value: expected_value || 'medium',
    notes: notes || null,
  })
  if (simErr) return NextResponse.json({ error: simErr.message }, { status: 500, headers: CORS })

  if (Array.isArray(nodes) && nodes.length > 0) {
    const rows = nodes.map((n: { entity_id: string; entity_type: string; position_x: number; position_y: number }) => ({
      id: `${simId}-n-${n.entity_id}`,
      simulation_id: simId,
      entity_id: n.entity_id,
      entity_type: n.entity_type,
      position_x: Math.round(n.position_x),
      position_y: Math.round(n.position_y),
    }))
    await sb.from('simulation_nodes').insert(rows)
  }

  if (Array.isArray(edges) && edges.length > 0) {
    const rows = edges.map((e: { source_id: string; target_id: string; relation_type: string }, i: number) => ({
      id: `${simId}-e-${i}`,
      simulation_id: simId,
      source_id: e.source_id,
      target_id: e.target_id,
      relation_type: e.relation_type || 'related_to',
    }))
    await sb.from('simulation_edges').insert(rows)
  }

  return NextResponse.json({ id: simId, name }, { headers: CORS })
}
