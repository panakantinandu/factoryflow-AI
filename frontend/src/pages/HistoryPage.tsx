import { useEffect, useState } from 'react'
import { fetchIncidents } from '../lib/api'
import type { Incident, IncidentPage } from '../lib/api'

const STATUS_COLORS: Record<string, string> = {
  resolved: 'text-green-400 bg-green-950/30 border-green-800',
  open:     'text-yellow-400 bg-yellow-950/30 border-yellow-800',
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function ConfidencePip({ score }: { score: number | null }) {
  if (score == null) return <span className="text-factory-muted">—</span>
  const pct = Math.round(score * 100)
  const color = score >= 0.8 ? 'bg-green-500' : score >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {pct}%
    </span>
  )
}

function ExpandedRow({ incident }: { incident: Incident }) {
  return (
    <div className="bg-black/20 border-t border-factory-border px-4 py-3 text-xs space-y-2">
      <div>
        <span className="text-factory-muted">Operator report: </span>
        <span className="text-gray-300">{incident.operatorInput}</span>
      </div>
      {incident.probableCause && (
        <div>
          <span className="text-factory-muted">Probable cause: </span>
          <span className="text-gray-300">{incident.probableCause}</span>
        </div>
      )}
      {incident.recommendedFix && (
        <div>
          <span className="text-factory-muted">Fix: </span>
          <pre className="whitespace-pre-wrap text-green-300 bg-black/30 rounded p-2 mt-1 border border-factory-border">
            {incident.recommendedFix}
          </pre>
        </div>
      )}
    </div>
  )
}

export function HistoryPage() {
  const [page, setPage] = useState<IncidentPage | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [filterAlarm, setFilterAlarm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = (p: number, alarm: string, status: string) => {
    setLoading(true)
    fetchIncidents(p, 15, alarm || undefined, status || undefined)
      .then(setPage)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(currentPage, filterAlarm, filterStatus) }, [currentPage, filterAlarm, filterStatus])

  const applyFilters = () => { setCurrentPage(0); load(0, filterAlarm, filterStatus) }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Incident History</h1>
        <p className="text-xs text-factory-muted mt-1">All alarm incidents logged through the system</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Alarm code…"
          value={filterAlarm}
          onChange={(e) => setFilterAlarm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          className="bg-factory-panel border border-factory-border rounded px-3 py-1.5 text-xs text-gray-200 placeholder-factory-muted focus:outline-none focus:border-factory-accent w-36"
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(0) }}
          className="bg-factory-panel border border-factory-border rounded px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-factory-accent"
        >
          <option value="">All statuses</option>
          <option value="resolved">Resolved</option>
          <option value="open">Open</option>
        </select>
        <button
          onClick={applyFilters}
          className="px-3 py-1.5 bg-factory-accent hover:bg-blue-500 text-white text-xs rounded transition-colors"
        >
          Filter
        </button>
        {(filterAlarm || filterStatus) && (
          <button
            onClick={() => { setFilterAlarm(''); setFilterStatus(''); setCurrentPage(0) }}
            className="text-xs text-factory-muted hover:text-gray-300"
          >
            Clear
          </button>
        )}
        {page && (
          <span className="text-xs text-factory-muted ml-auto">
            {page.totalElements} incidents
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800 rounded-lg p-3 text-sm text-red-300">
          {error} — is Spring Boot running?
        </div>
      )}

      {/* Table */}
      <div className="bg-factory-panel border border-factory-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-factory-border bg-black/20">
              <th className="text-left px-4 py-3 text-factory-muted font-medium">ID</th>
              <th className="text-left px-4 py-3 text-factory-muted font-medium">Alarm</th>
              <th className="text-left px-4 py-3 text-factory-muted font-medium">Shift</th>
              <th className="text-left px-4 py-3 text-factory-muted font-medium">Status</th>
              <th className="text-left px-4 py-3 text-factory-muted font-medium">Confidence</th>
              <th className="text-left px-4 py-3 text-factory-muted font-medium">Downtime</th>
              <th className="text-left px-4 py-3 text-factory-muted font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-factory-muted">
                  <span className="cursor-blink">▌</span> Loading…
                </td>
              </tr>
            )}
            {!loading && page?.content.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-factory-muted">
                  No incidents found
                </td>
              </tr>
            )}
            {!loading && page?.content.map((incident: Incident) => (
              <>
                <tr
                  key={incident.id}
                  onClick={() => setExpanded(expanded === incident.id ? null : incident.id)}
                  className="border-b border-factory-border/50 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-factory-muted">#{incident.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-factory-accent">
                      {incident.alarmCode ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{incident.shift ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${STATUS_COLORS[incident.resolutionStatus] ?? 'text-gray-400 border-gray-700'}`}>
                      {incident.resolutionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ConfidencePip score={incident.confidenceScore} />
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {incident.estimatedDowntimeMinutes != null ? `${incident.estimatedDowntimeMinutes}m` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmt(incident.createdAt)}</td>
                </tr>
                {expanded === incident.id && (
                  <tr key={`${incident.id}-exp`}>
                    <td colSpan={7} className="p-0">
                      <ExpandedRow incident={incident} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {page && page.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1.5 text-xs border border-factory-border rounded text-factory-muted hover:text-gray-300 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-factory-muted">
            Page {currentPage + 1} of {page.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(page.totalPages - 1, p + 1))}
            disabled={currentPage >= page.totalPages - 1}
            className="px-3 py-1.5 text-xs border border-factory-border rounded text-factory-muted hover:text-gray-300 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
