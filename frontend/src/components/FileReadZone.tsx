import { useState, useRef, useEffect, useCallback } from 'react'

type ZoneState = 'idle' | 'dragover' | 'reading' | 'done'

interface Props {
  onFileRead: (text: string, filename: string) => void
  disabled?: boolean
}

const HEX_COLS = 10
const HEX_ROWS = 5
const SEGS = 22

function randomHexRow(): string {
  return Array.from({ length: HEX_COLS }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
  ).join(' ')
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ROW_COLORS = [
  'text-factory-accent/65',
  'text-purple-400/55',
  'text-cyan-400/50',
  'text-blue-300/60',
  'text-indigo-400/55',
]

export function FileReadZone({ onFileRead, disabled }: Props) {
  const [zone, setZone] = useState<ZoneState>('idle')
  const [progress, setProgress] = useState(0)
  const [filename, setFilename] = useState('')
  const [filesize, setFilesize] = useState('')
  const [matrix, setMatrix] = useState<string[]>(() =>
    Array.from({ length: HEX_ROWS }, randomHexRow)
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (zone !== 'reading') {
      if (tickRef.current) clearInterval(tickRef.current)
      return
    }
    tickRef.current = setInterval(() => {
      setMatrix(Array.from({ length: HEX_ROWS }, randomHexRow))
    }, 90)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [zone])

  const readFile = useCallback((file: File) => {
    setFilename(file.name)
    setFilesize(fmtSize(file.size))
    setProgress(0)
    setZone('reading')

    const reader = new FileReader()
    reader.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.min(99, Math.floor((e.loaded / e.total) * 100)))
    }
    reader.onload = (e) => {
      setProgress(100)
      setZone('done')
      setTimeout(() => {
        const text = (e.target?.result as string) ?? ''
        onFileRead(text, file.name)
        setZone('idle')
        setProgress(0)
        if (inputRef.current) inputRef.current.value = ''
      }, 950)
    }
    reader.onerror = () => setZone('idle')
    reader.readAsText(file)
  }, [onFileRead])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setZone('idle')
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }, [readFile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
  }

  const isDone = zone === 'done'
  const filled = Math.round((progress / 100) * SEGS)

  // ── Idle ────────────────────────────────────────────────────────────────────
  if (zone === 'idle') {
    return (
      <label
        className={`inline-flex items-center gap-1.5 text-xs cursor-pointer select-none
          text-factory-muted hover:text-factory-accent
          border border-factory-border hover:border-factory-accent/50
          px-3 py-1 rounded transition-all duration-200
          ${disabled ? 'opacity-40 pointer-events-none' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setZone('dragover') }}
        onDragLeave={() => setZone('idle')}
        onDrop={disabled ? undefined : handleDrop}
      >
        <span className="text-sm leading-none">⊞</span>
        <span>Read file</span>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.log,.csv,.json,.xml,.md,.py,.js,.ts,.yaml,.yml,.toml,.ini,.conf"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />
      </label>
    )
  }

  // ── Drag-over ───────────────────────────────────────────────────────────────
  if (zone === 'dragover') {
    return (
      <div
        className="file-drop-zone glow-box border-2 border-dashed border-factory-accent rounded-lg py-5 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setZone('idle')}
        onDrop={handleDrop}
      >
        <div className="text-3xl text-factory-accent mb-1.5">⊞</div>
        <div className="text-xs text-factory-accent font-mono tracking-widest">
          DROP FILE TO READ <span className="cursor-blink">▌</span>
        </div>
        <div className="text-[10px] text-factory-muted mt-1">txt · log · csv · json · yaml · …</div>
      </div>
    )
  }

  // ── Reading / Done ──────────────────────────────────────────────────────────
  return (
    <div
      className={`relative rounded-lg border overflow-hidden transition-colors duration-300 font-mono
        ${isDone ? 'border-factory-success done-glow' : 'border-factory-accent glow-box'}
      `}
    >
      {/* Scan line (only while reading) */}
      {!isDone && <div className="scan-line" />}

      <div className="relative z-10 bg-factory-panel/95 px-4 pt-3 pb-3">

        {/* ── Row 1: filename ── */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`text-base shrink-0 ${isDone ? 'text-factory-success' : 'text-factory-accent'}`}>
            {isDone ? '✓' : '⊞'}
          </span>
          <span className="text-sm text-white truncate flex-1">{filename}</span>
          <span className="text-[10px] text-factory-muted shrink-0">{filesize}</span>
        </div>

        {/* ── Row 2: segmented progress bar ── */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex gap-px flex-1">
            {Array.from({ length: SEGS }, (_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-sm transition-colors duration-75 ${
                  i < filled
                    ? isDone
                      ? 'bg-factory-success'
                      : i % 4 === 0
                        ? 'bg-factory-accent'
                        : i % 4 === 1
                          ? 'bg-blue-400'
                          : i % 4 === 2
                            ? 'bg-factory-accent'
                            : 'bg-sky-300'
                    : 'bg-factory-border'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-factory-muted w-9 text-right tabular-nums shrink-0">
            {Math.round(progress)}%
          </span>
        </div>

        {/* ── Row 3: hex matrix OR done message ── */}
        {!isDone ? (
          <div
            className="overflow-hidden select-none mb-2"
            style={{ height: `${HEX_ROWS * 13}px` }}
          >
            {matrix.map((row, i) => (
              <div
                key={i}
                className={`flex gap-2 text-[9px] leading-[13px] hex-row ${ROW_COLORS[i % ROW_COLORS.length]}`}
                style={{ animationDelay: `${i * 25}ms` }}
              >
                <span className="text-factory-muted/35 shrink-0 tabular-nums">
                  {(i * HEX_COLS).toString(16).padStart(4, '0').toUpperCase()}:
                </span>
                <span>{row}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-factory-success flex items-center gap-2 mb-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-factory-success shrink-0 pulse-dot" />
            Read complete — injecting into input field
          </div>
        )}

        {/* ── Row 4: status footer ── */}
        {!isDone && (
          <div className="flex items-center gap-1.5 text-[10px] text-factory-muted border-t border-factory-border/50 pt-1.5">
            <span className="cursor-blink">▌</span>
            <span>reading bytes…</span>
            <span className="ml-auto text-factory-accent/35 tabular-nums tracking-widest">
              {[0, 1, 2].map((k) =>
                ((progress * 137.5 + k * 0x4000) | 0)
                  .toString(16).padStart(4, '0').toUpperCase()
              ).join(' ')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
