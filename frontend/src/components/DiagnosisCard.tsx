import type { Diagnosis, Report, Handoff } from '../lib/api'

interface Props {
  alarmCode: string | null
  machineType: string | null
  diagnosis: Diagnosis | null
  report: Report | null
  handoff: Handoff | null
  confidenceScore: number
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color =
    score >= 0.8
      ? 'text-green-400 border-green-700 bg-green-950/40'
      : score >= 0.5
        ? 'text-yellow-400 border-yellow-700 bg-yellow-950/40'
        : 'text-red-400 border-red-700 bg-red-950/40'

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-xs font-medium ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {pct}% confidence
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-factory-muted uppercase tracking-widest mb-2">{title}</div>
      <div className="text-sm text-gray-200 leading-relaxed">{children}</div>
    </div>
  )
}

export function DiagnosisCard({
  alarmCode,
  machineType,
  diagnosis,
  report,
  handoff,
  confidenceScore,
}: Props) {
  if (!diagnosis) return null

  const isKnown = diagnosis.source === 'known_resolution'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {alarmCode && (
                <span className="font-mono text-lg font-bold text-factory-accent">{alarmCode}</span>
              )}
              {machineType && (
                <span className="text-sm text-factory-muted">— {machineType}</span>
              )}
            </div>
            {isKnown && diagnosis.times_previously_resolved !== undefined && (
              <div className="text-xs text-green-400 flex items-center gap-1.5">
                <span>✓</span>
                This fix has resolved this alarm {diagnosis.times_previously_resolved} time(s) before
                — <span className="font-medium">fast path taken</span>
              </div>
            )}
          </div>
          <ConfidenceBadge score={confidenceScore} />
        </div>

        <div className="space-y-4">
          <Section title="Probable Cause">{diagnosis.probable_cause}</Section>
          <Section title="Recommended Fix">
            <pre className="whitespace-pre-wrap font-mono text-xs bg-black/30 rounded p-3 text-green-300 border border-factory-border">
              {diagnosis.recommended_fix}
            </pre>
          </Section>
          {diagnosis.estimated_downtime_minutes && (
            <div className="text-xs text-factory-muted">
              Estimated downtime:{' '}
              <span className="text-yellow-400 font-medium">
                {diagnosis.estimated_downtime_minutes} min
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Report */}
      {report && (
        <div className="bg-factory-panel border border-factory-border rounded-lg p-5">
          <div className="text-xs text-factory-muted uppercase tracking-widest mb-4">
            Maintenance Report
          </div>
          <div className="space-y-3">
            <Section title="Root Cause">{report.root_cause}</Section>
            <Section title="Resolution Steps">
              <pre className="whitespace-pre-wrap font-mono text-xs bg-black/30 rounded p-3 text-gray-300 border border-factory-border">
                {report.resolution_steps}
              </pre>
            </Section>
            {report.parts_replaced && report.parts_replaced !== 'None' && (
              <Section title="Parts Replaced">{report.parts_replaced}</Section>
            )}
            <Section title="Recommendations">{report.recommendations}</Section>
          </div>
        </div>
      )}

      {/* Handoff */}
      {handoff && (
        <div className="bg-factory-panel border border-factory-border rounded-lg p-5">
          <div className="text-xs text-factory-muted uppercase tracking-widest mb-4">
            Shift Handoff Note
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-factory-muted">Machine Status:</span>
              <span className="text-sm font-medium text-green-300">{handoff.machine_status}</span>
            </div>
            <Section title="Actions Taken">{handoff.actions_taken}</Section>
            {handoff.pending_work && handoff.pending_work !== 'None — resolved' && (
              <Section title="Pending Work">
                <span className="text-yellow-300">{handoff.pending_work}</span>
              </Section>
            )}
            <Section title="Next Shift — Watch For">{handoff.recommendations_next}</Section>
          </div>
        </div>
      )}
    </div>
  )
}
