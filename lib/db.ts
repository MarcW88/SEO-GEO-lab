import { createClient } from '@supabase/supabase-js'
import type { Experiment, Capability, Tool, Relation } from './types'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function getExperiments(): Promise<Experiment[]> {
  const sb = getClient()
  if (!sb) return []
  const { data } = await sb
    .from('experiments')
    .select('data')
    .order('updated_at', { ascending: false })
  return (data ?? []).map((r: { data: Experiment }) => r.data)
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
  const { data } = await sb.from('capabilities').select('data')
  return (data ?? []).map((r: { data: Capability }) => r.data)
}

export async function getTools(): Promise<Tool[]> {
  const sb = getClient()
  if (!sb) return []
  const { data } = await sb.from('tools').select('data')
  return (data ?? []).map((r: { data: Tool }) => r.data)
}

export async function getRelations(): Promise<Relation[]> {
  const sb = getClient()
  if (!sb) return []
  const { data } = await sb.from('relations').select('data')
  return (data ?? []).map((r: { data: Relation }) => r.data)
}
