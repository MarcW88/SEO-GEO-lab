export type ExperimentStatus =
  | 'idea'
  | 'testing'
  | 'validated'
  | 'production'
  | 'failed'
  | 'paused'
  | 'archived'

export type ExperimentDecision =
  | 'keep'
  | 'deepen'
  | 'industrialize'
  | 'merge'
  | 'replace'
  | 'kill'
  | null

export interface Learning {
  text: string
  type: 'finding' | 'warning' | 'blocker'
}

export interface Experiment {
  id: string
  name: string
  capability_id: string
  status: ExperimentStatus
  decision: ExperimentDecision
  value: number
  maturity: number
  question: string
  learnings: Learning[]
  inputs: string[]
  tool_ids: string[]
  clients: string[]
  related_ids: string[]
  next_experiment?: string
  tags: string[]
  linkedin_url?: string
  linkedin_label?: string
  created_at: string
  updated_at: string
}

export interface Capability {
  id: string
  name: string
  parent_id?: string
  description?: string
  maturity: number
  color: string
}

export interface Tool {
  id: string
  name: string
  type: 'data_source' | 'platform' | 'library' | 'api' | 'internal'
  description?: string
  url?: string
}

export type RelationType =
  | 'uses'
  | 'validates'
  | 'extends'
  | 'feeds'
  | 'enables'
  | 'related_to'
  | 'replaced_by'

export type EntityType = 'experiment' | 'capability' | 'tool' | 'pipeline'

export interface Relation {
  id: string
  source_id: string
  source_type: EntityType
  target_id: string
  target_type: EntityType
  relation_type: RelationType
}
