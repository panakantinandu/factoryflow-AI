import { useEffect, useRef } from 'react'
import type { ReasoningStep } from '../lib/api'

interface Props {
  steps: ReasoningStep[]
  isStreaming: boolean
}

const NODE_COLORS: Record<string, string> = {
  parse_alarm: 'text-purple-400',
  search_known: 'text-blue-400',
  use_known_fix: 'text-green-400',
  retrieve_manual: 'text-yellow-400',
  search_incidents: 'text-orange-400',
  web_search: 'text-pink-400',
  generate_diagnosis: 'text-cyan-400',
  generate_report: 'text-teal-400',
  generate_handoff: 'text-indigo-400',
  persist_knowledge: 'text-green-300',
}

const NODE_ICONS: Record<string, string> = {
  parse_alarm: '◈',
  search_known: '⌗',
  use_known_fix: '✓',
  retrieve_manual: '⊞',
  search_incidents: '⊟',
  web_search: '⊕',
  generate_diagnosis: '◆',
  generate_report: '▣',
  generate_handoff: '▤',
  persist_knowledge: '▲',
}

export function ReasoningStream({ steps, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [steps.length])

  if (steps.length === 0 && !isStreaming) return null

  return (
    <div className="bg-factory-panel border border-factory-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-factory-border bg-black/20">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-factory-muted ml-2">agent reasoning trace</span>
        {isStreaming && (
          <span className="ml-auto text-xs text-factory-accent flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-factory-accent inline-block cursor-blink" />
            running
          </span>
        )}
      </div>

      <div className="p-4 font-mono text-xs space-y-3 max-h-72 overflow-y-auto">
        {steps.map((step, i) => (
          <div key={i} className="slide-in flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`text-base ${NODE_COLORS[step.node_name] ?? 'text-gray-400'}`}>
                {NODE_ICONS[step.node_name] ?? '○'}
              </span>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-factory-border mt-1" />
              )}
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-semibold ${NODE_COLORS[step.node_name] ?? 'text-gray-400'}`}>
                  {step.node_name}
                </span>
                {step.tool_called && (
                  <span className="text-factory-muted">→ {step.tool_called}</span>
                )}
              </div>
              <div className="text-factory-muted leading-relaxed">
                {step.output_summary}
              </div>
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex gap-3 slide-in">
            <span className="text-factory-muted text-base">○</span>
            <span className="text-factory-muted">
              <span className="cursor-blink">▌</span>
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
