import { NextRequest, NextResponse } from 'next/server'
import { isValidAccessToken } from '@/lib/oauth'
import { createClient } from '@supabase/supabase-js'
import type { Experiment, Capability, Tool, Relation } from '@/lib/types'

export const maxDuration = 30

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Session-Id, MCP-Protocol-Version',
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

function rpc(id: unknown, result: unknown) {
  return json({ jsonrpc: '2.0', id, result })
}

function rpcError(id: unknown, code: number, message: string) {
  return json({ jsonrpc: '2.0', id, error: { code, message } })
}

const TOOLS = [
  {
    name: 'add_experiment',
    description: 'Add a new R&D experiment to the SEO/GEO Lab. Use this to register a hypothesis, test or learning.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Short experiment name (required)' },
        capability_id: {
          type: 'string',
          description: 'Capability this experiment belongs to. Use list_capabilities to get valid IDs.',
        },
        status: {
          type: 'string',
          enum: ['idea', 'testing', 'validated', 'production', 'failed', 'paused', 'archived'],
          description: 'Current lifecycle status (required)',
        },
        question: { type: 'string', description: 'The research question being tested (required)' },
        decision: {
          type: 'string',
          enum: ['keep', 'deepen', 'industrialize', 'merge', 'replace', 'kill'],
          description: 'Decision taken on this experiment',
        },
        value: { type: 'number', description: 'Estimated business value, 1 (low) to 5 (high)' },
        maturity: { type: 'number', description: 'Technical maturity, 1 (prototype) to 5 (production-ready)' },
        tool_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of tools used. Use list_tools to get valid IDs.',
        },
        clients: { type: 'array', items: { type: 'string' }, description: 'Client names this was tested on' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
        learnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['finding', 'warning', 'blocker'] },
              text: { type: 'string' },
            },
            required: ['type', 'text'],
          },
          description: 'Key learnings: findings (✅), warnings (⚠️), or blockers (❌)',
        },
        next_experiment: { type: 'string', description: 'What to test next based on this experiment' },
        related_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of related experiments',
        },
        inputs: { type: 'array', items: { type: 'string' }, description: 'Data inputs used' },
      },
      required: ['name', 'status', 'question'],
    },
  },
  {
    name: 'update_experiment',
    description: 'Update fields of an existing experiment (status, decision, learnings, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Experiment ID (required)' },
        status: {
          type: 'string',
          enum: ['idea', 'testing', 'validated', 'production', 'failed', 'paused', 'archived'],
        },
        decision: {
          type: 'string',
          enum: ['keep', 'deepen', 'industrialize', 'merge', 'replace', 'kill'],
        },
        value: { type: 'number' },
        maturity: { type: 'number' },
        learnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['finding', 'warning', 'blocker'] },
              text: { type: 'string' },
            },
            required: ['type', 'text'],
          },
        },
        next_experiment: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        clients: { type: 'array', items: { type: 'string' } },
        capability_id: { type: 'string' },
        tool_ids: { type: 'array', items: { type: 'string' } },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_experiments',
    description: 'List experiments from the SEO/GEO Lab, with optional filters.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['idea', 'testing', 'validated', 'production', 'failed', 'paused', 'archived', 'all'],
          description: 'Filter by lifecycle status. Default: all',
        },
        capability_id: { type: 'string', description: 'Filter by capability' },
        limit: { type: 'number', description: 'Max results. Default: 30' },
      },
    },
  },
  {
    name: 'add_capability',
    description: 'Add a capability (skill area) to the lab taxonomy.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Capability name (required)' },
        description: { type: 'string', description: 'What this capability covers' },
        maturity: { type: 'number', description: 'Maturity score 0–100' },
        color: { type: 'string', description: 'Hex color for visualization, e.g. #6366f1' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_capabilities',
    description: 'List all capabilities in the lab.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'add_tool',
    description: 'Add a tool or data source used in experiments.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Tool name (required)' },
        type: {
          type: 'string',
          enum: ['data_source', 'platform', 'library', 'api', 'internal'],
          description: 'Tool category (required)',
        },
        description: { type: 'string', description: 'What this tool does' },
        url: { type: 'string', description: 'URL or documentation link' },
      },
      required: ['name', 'type'],
    },
  },
  {
    name: 'list_tools',
    description: 'List all tools registered in the lab.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'add_relation',
    description: 'Add a typed relation between two entities (experiment, capability, or tool).',
    inputSchema: {
      type: 'object',
      properties: {
        source_id: { type: 'string', description: 'Source entity ID (required)' },
        source_type: {
          type: 'string',
          enum: ['experiment', 'capability', 'tool'],
          description: 'Type of source entity (required)',
        },
        target_id: { type: 'string', description: 'Target entity ID (required)' },
        target_type: {
          type: 'string',
          enum: ['experiment', 'capability', 'tool'],
          description: 'Type of target entity (required)',
        },
        relation_type: {
          type: 'string',
          enum: ['uses', 'validates', 'extends', 'feeds', 'enables', 'related_to', 'replaced_by'],
          description: 'Nature of the relation (required)',
        },
      },
      required: ['source_id', 'source_type', 'target_id', 'target_type', 'relation_type'],
    },
  },
]

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleAddExperiment(args: Record<string, unknown>): Promise<string> {
  const sb = getSupabase()
  if (!sb) return '❌ Supabase not configured (add NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).'

  const name = (args.name as string)?.trim()
  if (!name) return '❌ name is required.'
  const status = (args.status as string) ?? 'idea'
  const question = (args.question as string)?.trim()
  if (!question) return '❌ question is required.'

  const now = new Date().toISOString()
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)

  const experiment: Experiment = {
    id,
    name,
    capability_id: (args.capability_id as string) ?? '',
    status: status as Experiment['status'],
    decision: (args.decision as Experiment['decision']) ?? null,
    value: (args.value as number) ?? 3,
    maturity: (args.maturity as number) ?? 1,
    question,
    learnings: (args.learnings as Experiment['learnings']) ?? [],
    inputs: (args.inputs as string[]) ?? [],
    tool_ids: (args.tool_ids as string[]) ?? [],
    clients: (args.clients as string[]) ?? [],
    related_ids: (args.related_ids as string[]) ?? [],
    next_experiment: (args.next_experiment as string) ?? null,
    tags: (args.tags as string[]) ?? [],
    created_at: now,
    updated_at: now,
  }

  const { error } = await sb.from('experiments').insert({ id, data: experiment, updated_at: now })
  if (error) return `❌ Failed to add experiment: ${error.message}`

  return [
    `✅ Experiment added!`,
    `**Name:** ${experiment.name}`,
    `**ID:** ${experiment.id}`,
    `**Status:** ${experiment.status}`,
    experiment.decision ? `**Decision:** ${experiment.decision}` : null,
    experiment.capability_id ? `**Capability:** ${experiment.capability_id}` : null,
    `**Question:** ${experiment.question}`,
  ].filter(Boolean).join('\n')
}

async function handleUpdateExperiment(args: Record<string, unknown>): Promise<string> {
  const sb = getSupabase()
  if (!sb) return '❌ Supabase not configured.'

  const id = (args.id as string)?.trim()
  if (!id) return '❌ id is required.'

  const { data, error: fetchError } = await sb.from('experiments').select('data').eq('id', id).single()
  if (fetchError || !data) return `❌ Experiment "${id}" not found.`

  const existing = data.data as Experiment
  const updatable = ['status', 'decision', 'value', 'maturity', 'learnings', 'next_experiment', 'tags', 'clients', 'capability_id', 'tool_ids', 'related_ids']

  const updated: Experiment = { ...existing, updated_at: new Date().toISOString() }
  for (const key of updatable) {
    if (args[key] !== undefined) {
      (updated as unknown as Record<string, unknown>)[key] = args[key]
    }
  }

  const { error } = await sb.from('experiments').update({ data: updated, updated_at: updated.updated_at }).eq('id', id)
  if (error) return `❌ Failed to update: ${error.message}`

  return [
    `✅ Experiment updated!`,
    `**Name:** ${updated.name}`,
    `**Status:** ${updated.status}`,
    updated.decision ? `**Decision:** ${updated.decision}` : null,
  ].filter(Boolean).join('\n')
}

async function handleListExperiments(args: Record<string, unknown>): Promise<string> {
  const sb = getSupabase()
  if (!sb) return '❌ Supabase not configured.'

  const limit = Math.min((args.limit as number) ?? 30, 50)
  const { data, error } = await sb.from('experiments').select('data').order('updated_at', { ascending: false }).limit(limit)
  if (error) return `❌ Failed to fetch: ${error.message}`
  if (!data || data.length === 0) return 'No experiments yet. Use add_experiment to get started.'

  let exps = data.map((r: { data: Experiment }) => r.data)

  const statusFilter = args.status as string
  if (statusFilter && statusFilter !== 'all') exps = exps.filter((e) => e.status === statusFilter)

  const capFilter = args.capability_id as string
  if (capFilter) exps = exps.filter((e) => e.capability_id === capFilter)

  if (exps.length === 0) return 'No experiments match the filters.'

  const lines = exps.map((e) => {
    const parts = [`• **${e.name}** [${e.status}]`]
    if (e.decision) parts.push(`→ ${e.decision}`)
    if (e.capability_id) parts.push(`| cap: ${e.capability_id}`)
    parts.push(`| id: \`${e.id}\``)
    return parts.join(' ')
  })

  return `**${exps.length} experiment(s):**\n\n${lines.join('\n')}`
}

async function handleAddCapability(args: Record<string, unknown>): Promise<string> {
  const sb = getSupabase()
  if (!sb) return '❌ Supabase not configured.'

  const name = (args.name as string)?.trim()
  if (!name) return '❌ name is required.'

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const capability: Capability = {
    id,
    name,
    description: (args.description as string) ?? undefined,
    maturity: (args.maturity as number) ?? 0,
    color: (args.color as string) ?? '#6366f1',
  }

  const { error } = await sb.from('capabilities').upsert({ id, data: capability })
  if (error) return `❌ Failed to add capability: ${error.message}`

  return `✅ Capability added!\n**Name:** ${capability.name}\n**ID:** ${capability.id}\n**Maturity:** ${capability.maturity}%`
}

async function handleListCapabilities(): Promise<string> {
  const sb = getSupabase()
  if (!sb) return '❌ Supabase not configured.'

  const { data, error } = await sb.from('capabilities').select('data')
  if (error) return `❌ Failed to fetch: ${error.message}`
  if (!data || data.length === 0) return 'No capabilities yet. Use add_capability to create one.'

  const caps = data.map((r: { data: Capability }) => r.data)
  const lines = caps.map((c) => `• **${c.name}** | id: \`${c.id}\` | maturity: ${c.maturity}%`)
  return `**${caps.length} capability(ies):**\n\n${lines.join('\n')}`
}

async function handleAddTool(args: Record<string, unknown>): Promise<string> {
  const sb = getSupabase()
  if (!sb) return '❌ Supabase not configured.'

  const name = (args.name as string)?.trim()
  if (!name) return '❌ name is required.'
  const type = args.type as string
  if (!type) return '❌ type is required.'

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const tool: Tool = {
    id,
    name,
    type: type as Tool['type'],
    description: (args.description as string) ?? undefined,
    url: (args.url as string) ?? undefined,
  }

  const { error } = await sb.from('tools').upsert({ id, data: tool })
  if (error) return `❌ Failed to add tool: ${error.message}`

  return `✅ Tool added!\n**Name:** ${tool.name}\n**ID:** ${tool.id}\n**Type:** ${tool.type}`
}

async function handleListTools(): Promise<string> {
  const sb = getSupabase()
  if (!sb) return '❌ Supabase not configured.'

  const { data, error } = await sb.from('tools').select('data')
  if (error) return `❌ Failed to fetch: ${error.message}`
  if (!data || data.length === 0) return 'No tools yet. Use add_tool to add one.'

  const toolList = data.map((r: { data: Tool }) => r.data)
  const lines = toolList.map((t) => `• **${t.name}** [${t.type}] | id: \`${t.id}\`${t.description ? ` — ${t.description}` : ''}`)
  return `**${toolList.length} tool(s):**\n\n${lines.join('\n')}`
}

async function handleAddRelation(args: Record<string, unknown>): Promise<string> {
  const sb = getSupabase()
  if (!sb) return '❌ Supabase not configured.'

  const required = ['source_id', 'source_type', 'target_id', 'target_type', 'relation_type']
  for (const f of required) {
    if (!args[f]) return `❌ ${f} is required.`
  }

  const id = `${args.source_id}-${args.relation_type}-${args.target_id}`
  const relation: Relation = {
    id,
    source_id: args.source_id as string,
    source_type: args.source_type as Relation['source_type'],
    target_id: args.target_id as string,
    target_type: args.target_type as Relation['target_type'],
    relation_type: args.relation_type as Relation['relation_type'],
  }

  const { error } = await sb.from('relations').upsert({ id, data: relation })
  if (error) return `❌ Failed to add relation: ${error.message}`

  return `✅ Relation added!\n**${relation.source_id}** –[${relation.relation_type}]→ **${relation.target_id}**`
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token || !isValidAccessToken(token)) {
    const base = `https://${req.headers.get('host') ?? ''}`
    return new Response(
      JSON.stringify({ status: 'unauthorized', server: 'seo-geo-lab-mcp' }),
      {
        status: 401,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'WWW-Authenticate': `Bearer realm="mcp", resource_metadata="${base}/.well-known/oauth-protected-resource"`,
        },
      }
    )
  }
  return json({ status: 'ok', server: 'seo-geo-lab-mcp', version: '1.0.0' })
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null

  if (!token || !isValidAccessToken(token)) {
    const base = `https://${req.headers.get('host') ?? ''}`
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized' } }),
      {
        status: 401,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'WWW-Authenticate': `Bearer realm="mcp", resource_metadata="${base}/.well-known/oauth-protected-resource"`,
        },
      }
    )
  }

  let body: { jsonrpc: string; method: string; params?: Record<string, unknown>; id?: unknown }
  try {
    body = await req.json()
  } catch {
    return rpcError(null, -32700, 'Parse error')
  }

  const { method, params, id } = body

  if (method === 'initialize') {
    return rpc(id, {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'seo-geo-lab', version: '1.0.0' },
    })
  }

  if (method === 'notifications/initialized') {
    return new Response(null, { status: 202, headers: CORS_HEADERS })
  }

  if (method === 'tools/list') {
    return rpc(id, { tools: TOOLS })
  }

  if (method === 'tools/call') {
    const name = params?.name as string
    const args = (params?.arguments ?? {}) as Record<string, unknown>

    try {
      let result = ''
      if (name === 'add_experiment') result = await handleAddExperiment(args)
      else if (name === 'update_experiment') result = await handleUpdateExperiment(args)
      else if (name === 'list_experiments') result = await handleListExperiments(args)
      else if (name === 'add_capability') result = await handleAddCapability(args)
      else if (name === 'list_capabilities') result = await handleListCapabilities()
      else if (name === 'add_tool') result = await handleAddTool(args)
      else if (name === 'list_tools') result = await handleListTools()
      else if (name === 'add_relation') result = await handleAddRelation(args)
      else return rpc(id, { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true })

      return rpc(id, { content: [{ type: 'text', text: result }] })
    } catch (err) {
      return rpc(id, { content: [{ type: 'text', text: `❌ ${err instanceof Error ? err.message : String(err)}` }], isError: true })
    }
  }

  if (!id) return new Response(null, { status: 202, headers: CORS_HEADERS })

  return rpcError(id, -32601, `Method not found: ${method}`)
}
