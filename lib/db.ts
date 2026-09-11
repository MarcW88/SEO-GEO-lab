import { createClient } from '@supabase/supabase-js'
import type { Experiment, Capability, Tool, Relation } from './types'

const VALID_STATUSES = new Set([
  'idea', 'testing', 'validated', 'production', 'failed', 'paused', 'archived',
])

function normalizeExperiment(value: unknown): Experiment | null {
  if (!value || typeof value !== 'object') return null
  const exp = value as Partial<Experiment>
  if (!exp.id || !exp.name) return null

  return {
    ...exp,
    id: exp.id,
    name: exp.name,
    capability_id: exp.capability_id ?? '',
    status: VALID_STATUSES.has(exp.status ?? '') ? exp.status! : 'idea',
    decision: exp.decision ?? null,
    value: Number.isFinite(exp.value) ? exp.value! : 0,
    maturity: Number.isFinite(exp.maturity) ? exp.maturity! : 0,
    question: exp.question ?? '',
    learnings: Array.isArray(exp.learnings) ? exp.learnings : [],
    inputs: Array.isArray(exp.inputs) ? exp.inputs : [],
    tool_ids: Array.isArray(exp.tool_ids) ? exp.tool_ids : [],
    clients: Array.isArray(exp.clients) ? exp.clients : [],
    related_ids: Array.isArray(exp.related_ids) ? exp.related_ids : [],
    tags: Array.isArray(exp.tags) ? exp.tags : [],
    created_at: exp.created_at ?? '',
    updated_at: exp.updated_at ?? exp.created_at ?? '',
  }
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function getExperiments(): Promise<Experiment[]> {
  const sb = getClient()
  if (!sb) return []
  const { data, error } = await sb
    .from('experiments')
    .select('data')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(`Unable to load experiments: ${error.message}`)
  return (data ?? [])
    .map((r: { data: unknown }) => normalizeExperiment(r.data))
    .filter((exp): exp is Experiment => exp !== null)
}

export async function getExperiment(id: string): Promise<Experiment | null> {
  const sb = getClient()
  if (!sb) return null
  const { data } = await sb.from('experiments').select('data').eq('id', id).single()
  return (data?.data as Experiment) ?? null
}

export async function getCapabilities(): Promise<Capability[]> {
  const sb = getClient()
  if (!sb) return []
  const { data, error } = await sb.from('capabilities').select('data')
  if (error) throw new Error(`Unable to load capabilities: ${error.message}`)
  return (data ?? []).map((r: { data: Capability }) => r.data)
}

export async function getTools(): Promise<Tool[]> {
  const sb = getClient()
  if (!sb) return []
  const { data, error } = await sb.from('tools').select('data')
  if (error) throw new Error(`Unable to load tools: ${error.message}`)
  return (data ?? []).map((r: { data: Tool }) => r.data)
}

export async function getRelations(): Promise<Relation[]> {
  const sb = getClient()
  if (!sb) return []
  const { data } = await sb.from('relations').select('data')
  return (data ?? []).map((r: { data: Relation }) => r.data)
}
