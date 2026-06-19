import { useState } from 'react'
import { ChatInput } from '../components/ChatInput'
import { ReasoningStream } from '../components/ReasoningStream'
import { DiagnosisCard } from '../components/DiagnosisCard'
import { streamDiagnosis } from '../lib/api'
import type { ReasoningStep, DiagnosisResult } from '../lib/api'

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-950/40 border-red-700 text-red-400',
  HIGH:     'bg-orange-950/40 border-orange-700 text-orange-400',
  MEDIUM:   'bg-yellow-950/40 border-yellow-700 text-yellow-400',
  LOW:      'bg-green-950/40 border-green-700 text-green-400',
}

export function DiagnosePage() {
  const [steps, setSteps] = useState<ReasoningStep[]>([])
  const [result, setResult] = useState<Partial<DiagnosisResult> | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (operatorInput: string, shift: string) => {
    setSteps([])
    setResult(null)
    setError(null)
    setIsStreaming(true)

    try {
      await streamDiagnosis(
        operatorInput,
        shift,
        (step) => setSteps((prev) => [...prev, step]),
        (r) => setResult(r),
        () => setIsStreaming(false),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsStreaming(false)
    }
  }

  const severity = result?.severity

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Diagnose Alarm</h1>
        <p className="text-xs text-factory-muted mt-1">
          Describe the machine alarm in plain language — the agent searches manuals, incident history, and the web as needed.
        </p>
      </div>

      <div className="bg-factory-panel border border-factory-border rounded-lg p-5">
        <ChatInput onSubmit={handleSubmit} isLoading={isStreaming} />
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800 rounded-lg p-4 text-sm text-red-300">
          <span className="font-medium">Error:</span> {error}
          <div className="text-xs mt-1 opacity-70">Make sure the agent service is running on port 8000.</div>
        </div>
      )}

      {severity && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-medium ${SEVERITY_COLORS[severity] ?? 'text-gray-400 border-gray-700'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Severity: {severity}
          {severity === 'CRITICAL' && <span className="opacity-70">— deep search forced</span>}
        </div>
      )}

      <ReasoningStream steps={steps} isStreaming={isStreaming} />

      {result && result.diagnosis && (
        <DiagnosisCard
          alarmCode={result.alarm_code ?? null}
          machineType={result.machine_type ?? null}
          diagnosis={result.diagnosis}
          report={result.report ?? null}
          handoff={result.handoff ?? null}
          confidenceScore={result.confidence_score ?? 0}
        />
      )}

      {steps.length === 0 && !isStreaming && !result && !error && (
        <div className="text-center py-20 text-factory-muted">
          <div className="text-5xl mb-5 opacity-20">◈</div>
          <div className="text-sm">Describe an alarm above to begin</div>
          <div className="text-xs mt-2 opacity-50 max-w-sm mx-auto">
            The agent will show its reasoning in real time — each step visible as it happens
          </div>
        </div>
      )}
    </div>
  )
}
