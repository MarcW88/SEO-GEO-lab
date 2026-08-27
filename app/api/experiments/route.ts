import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

export async function POST(req: NextRequest) {
  const sb = getSB()
  if (!sb) return NextResponse.json({ error: 'No DB connection' }, { status: 500 })

  const body = await req.json()
  const {
    name,
    capability_id = '',
    tool_ids     = [],
    related_ids  = [],
    status       = 'idea',
    question     = '',
    tags         = [],
  } = body

  if (!name?.trim())
    return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const id  = `exp-${Date.now()}`
  const now = new Date().toISOString()

  const experiment = {
    id,
    name:           name.trim(),
    capability_id,
    status,
    decision:       null,
    value:          0,
    maturity:       0,
    question,
    learnings:      [],
    inputs:         [],
    tool_ids,
    clients:        [],
    related_ids,
    next_experiment: null,
    tags,
    created_at:     now,
    updated_at:     now,
  }

  const { error } = await sb.from('experiments').insert({
    id,
    data:       experiment,
    updated_at: now,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id, name: experiment.name }, { headers: CORS })
}
