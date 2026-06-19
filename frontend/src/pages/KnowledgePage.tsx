import { useEffect, useState } from 'react'
import { fetchKnowledge, deleteKnowledge } from '../lib/api'
import type { KnowledgeEntry } from '../lib/api'

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    fetchKnowledge()
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this knowledge entry? The next occurrence of this alarm will go through deep search.')) return
    setDeleting(id)
    try {
      await deleteKnowledge(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (e) {
      alert('Delete failed: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Knowledge Base</h1>
          <p className="text-xs text-factory-muted mt-1">
            Validated fixes distilled from resolved incidents. Each reuse makes the next resolution faster.
          </p>
        </div>
        <div className="text-xs text-factory-muted">
          {entries.length} entries
        </div>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800 rounded-lg p-3 text-sm text-red-300">
          {error} — is Spring Boot running?
        </div>
      )}

      {loading && (
        <div className="text-center py-16 text-factory-muted text-xs">
          <span className="cursor-blink">▌</span> Loading…
        </div>
      )}

      {!loading && entries.length === 0 && !error && (
        <div className="text-center py-16 text-factory-muted">
          <div className="text-4xl mb-3 opacity-20">◆</div>
          <div className="text-sm">No knowledge entries yet</div>
          <div className="text-xs mt-2 opacity-60">
            Entries appear here after the agent resolves alarms with confidence ≥ 60%
          </div>
        </div>
      )}

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-factory-panel border border-factory-border rounded-lg overflow-hidden"
          >
            {/* Header row */}
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-factory-accent">{entry.alarm_code}</span>
                  {entry.machine_type && (
                    <span className="text-xs text-factory-muted">— {entry.machine_type}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                  {entry.distilled_cause}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs shrink-0">
                <div className="text-center">
                  <div className="text-green-400 font-bold text-lg">{entry.times_reused}</div>
                  <div className="text-factory-muted text-[10px]">reuses</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-300">{fmt(entry.last_used_at)}</div>
                  <div className="text-factory-muted text-[10px]">last used</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">{fmt(entry.created_at)}</div>
                  <div className="text-factory-muted text-[10px]">created</div>
                </div>
                <span className="text-factory-muted">
                  {expanded === entry.id ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Expanded */}
            {expanded === entry.id && (
              <div className="border-t border-factory-border px-5 py-4 bg-black/20 space-y-4">
                <div>
                  <div className="text-xs text-factory-muted uppercase tracking-widest mb-2">
                    Distilled Cause
                  </div>
                  <div className="text-sm text-gray-200">{entry.distilled_cause}</div>
                </div>
                <div>
                  <div className="text-xs text-factory-muted uppercase tracking-widest mb-2">
                    Validated Fix
                  </div>
                  <pre className="text-xs text-green-300 bg-black/30 border border-factory-border rounded p-3 whitespace-pre-wrap">
                    {entry.distilled_fix}
                  </pre>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-factory-muted">
                    Used {entry.times_reused}× — saves an estimated{' '}
                    <span className="text-green-400 font-medium">
                      ~{entry.times_reused * 25} minutes
                    </span>{' '}
                    of re-derivation
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deleting === entry.id}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 px-3 py-1 rounded transition-colors disabled:opacity-40"
                  >
                    {deleting === entry.id ? 'Removing…' : 'Remove entry'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
