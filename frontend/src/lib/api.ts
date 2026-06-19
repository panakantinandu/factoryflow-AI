// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReasoningStep {
  node_name: string
  tool_called: string | null
  input_summary: string
  output_summary: string
}

export interface Diagnosis {
  probable_cause: string
  recommended_fix: string
  confidence_score: number
  estimated_downtime_minutes?: number
  source: string
  times_previously_resolved?: number
}

export interface Report {
  issue_summary: string
  root_cause: string
  resolution_steps: string
  parts_replaced: string
  downtime_minutes: number
  recommendations: string
}

export interface Handoff {
  machine_status: string
  actions_taken: string
  pending_work: string
  recommendations_next: string
}

export interface DiagnosisResult {
  incident_id?: number
  alarm_code: string | null
  machine_type: string | null
  severity?: string
  diagnosis: Diagnosis | null
  report: Report | null
  handoff: Handoff | null
  confidence_score: number
  reasoning_log: ReasoningStep[]
}

export interface AlarmFrequency {
  alarm_code: string
  count: number
}

export interface AnalyticsSummary {
  total_incidents: number
  resolved_count: number
  open_count: number
  avg_mttr_minutes: number
  total_downtime_minutes: number
  total_knowledge_entries: number
  total_reuse_events: number
  estimated_minutes_saved: number
  fast_path_count: number
  fast_path_pct: number
  top_alarms: AlarmFrequency[]
}

export interface MachineHealth {
  id: number
  name: string
  machine_type: string
  incident_count_30d: number
  avg_downtime_minutes: number
  health_score: number
  last_incident_at: string | null
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL'
}

export interface KnowledgeEntry {
  id: number
  alarm_code: string
  machine_type: string | null
  distilled_cause: string
  distilled_fix: string
  times_reused: number
  last_used_at: string | null
  created_at: string
}

export interface IncidentPage {
  content: Incident[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface Incident {
  id: number
  alarmCode: string | null
  operatorInput: string
  shift: string | null
  probableCause: string | null
  recommendedFix: string | null
  confidenceScore: number | null
  estimatedDowntimeMinutes: number | null
  resolutionStatus: string
  createdAt: string
  resolvedAt: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AGENT_URL = 'http://localhost:8000'
const API_URL = '/api'

// ── Agent streaming ───────────────────────────────────────────────────────────

export async function streamDiagnosis(
  operatorInput: string,
  shift: string | undefined,
  onStep: (step: ReasoningStep) => void,
  onResult: (result: Partial<DiagnosisResult>) => void,
  onDone: () => void,
): Promise<void> {
  const response = await fetch(`${AGENT_URL}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operator_input: operatorInput, shift }),
  })

  if (!response.ok || !response.body) {
    throw new Error(`Stream request failed: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.startsWith('event: result')) continue
      if (line.startsWith('data: ')) {
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') { onDone(); return }
        try {
          const parsed = JSON.parse(payload)
          if (parsed.node_name) onStep(parsed as ReasoningStep)
          else if (parsed.diagnosis) onResult(parsed as Partial<DiagnosisResult>)
        } catch { /* malformed — ignore */ }
      }
    }
  }
  onDone()
}

// ── REST via Spring Boot ──────────────────────────────────────────────────────

export async function diagnose(
  operatorInput: string,
  shift?: string,
  machineName?: string,
): Promise<DiagnosisResult> {
  const res = await fetch(`${API_URL}/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorInput, shift, machineName }),
  })
  if (!res.ok) throw new Error(`Diagnose failed (${res.status})`)
  return res.json()
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_URL}/analytics/summary`)
  if (!res.ok) throw new Error(`Analytics fetch failed (${res.status})`)
  return res.json()
}

export async function fetchMachineHealth(): Promise<MachineHealth[]> {
  const res = await fetch(`${API_URL}/analytics/machine-health`)
  if (!res.ok) throw new Error(`Machine health fetch failed (${res.status})`)
  return res.json()
}

export async function fetchKnowledge(): Promise<KnowledgeEntry[]> {
  const res = await fetch(`${API_URL}/knowledge`)
  if (!res.ok) throw new Error(`Knowledge fetch failed (${res.status})`)
  return res.json()
}

export async function deleteKnowledge(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/knowledge/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Delete failed (${res.status})`)
}

export async function fetchIncidents(
  page = 0,
  size = 20,
  alarmCode?: string,
  status?: string,
): Promise<IncidentPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (alarmCode) params.set('alarmCode', alarmCode)
  if (status) params.set('status', status)
  const res = await fetch(`${API_URL}/incidents?${params}`)
  if (!res.ok) throw new Error(`Incidents fetch failed (${res.status})`)
  return res.json()
}
