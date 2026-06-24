import { useState, useRef, useCallback } from 'react'
import { FileReadZone } from './FileReadZone'

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
  const [fileTag, setFileTag] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return
    onSubmit(input.trim(), shift)
    setInput('')
    setFileTag(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit()
    }
  }

  const handleFileRead = useCallback((text: string, filename: string) => {
    const MAX = 8_000
    const trimmed = text.length > MAX ? text.slice(0, MAX) + '\n…[truncated]' : text
    setInput(trimmed)
    setFileTag(filename)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {/* Shift + file attach row */}
      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
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
        <span className="ml-auto">
          <FileReadZone onFileRead={handleFileRead} disabled={isLoading} />
        </span>
      </div>

      {/* File badge — shown when a file has been loaded */}
      {fileTag && (
        <div className="flex items-center gap-2 text-[10px] font-mono text-factory-accent bg-blue-950/20 border border-factory-accent/30 rounded px-3 py-1 slide-in">
          <span>⊞</span>
          <span className="truncate">{fileTag}</span>
          <button
            onClick={() => { setInput(''); setFileTag(null) }}
            className="ml-auto text-factory-muted hover:text-red-400 transition-colors shrink-0"
            title="Clear file"
          >
            ✕
          </button>
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the alarm or issue in plain language…"
          rows={fileTag ? 5 : 3}
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

      {/* Demo prompts */}
      <div className="flex flex-wrap gap-2">
        {DEMO_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => { setInput(p); setFileTag(null) }}
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
