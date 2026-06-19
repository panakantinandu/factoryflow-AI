import { useState, useRef } from 'react'

interface Props {
  onSubmit: (input: string, shift: string) => void
  isLoading: boolean
}

const DEMO_PROMPTS = [
  'Machine E217 throwing alarm on Packaging Line B — keeps stopping mid-cycle',
  'Press Machine alarm code E042 came up 3 times this shift, Line A',
  'CNC Mill showing error F119 after tool change, operator says it started vibrating',
]

export function ChatInput({ onSubmit, isLoading }: Props) {
  const [input, setInput] = useState('')
  const [shift, setShift] = useState('Day')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return
    onSubmit(input.trim(), shift)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="text-factory-muted">SHIFT</span>
        {['Day', 'Evening', 'Night'].map((s) => (
          <button
            key={s}
            onClick={() => setShift(s)}
            className={`px-3 py-1 rounded border text-xs transition-colors ${
              shift === s
                ? 'border-factory-accent text-factory-accent bg-blue-950/30'
                : 'border-factory-border text-factory-muted hover:border-gray-500'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the alarm or issue in plain language…"
          rows={3}
          disabled={isLoading}
          className="w-full bg-factory-panel border border-factory-border rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-factory-muted resize-none focus:outline-none focus:border-factory-accent transition-colors disabled:opacity-50"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className="text-xs text-factory-muted">Ctrl+Enter</span>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="px-4 py-1.5 bg-factory-accent hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
          >
            {isLoading ? 'Running…' : 'Diagnose'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {DEMO_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => setInput(p)}
            disabled={isLoading}
            className="text-xs px-3 py-1 bg-factory-panel border border-factory-border text-factory-muted hover:text-gray-300 hover:border-gray-500 rounded transition-colors disabled:opacity-40 truncate max-w-xs"
          >
            {p.slice(0, 60)}…
          </button>
        ))}
      </div>
    </div>
  )
}
