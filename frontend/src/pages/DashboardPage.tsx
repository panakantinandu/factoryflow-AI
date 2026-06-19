import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { fetchAnalytics, fetchMachineHealth } from '../lib/api'
import type { AnalyticsSummary, MachineHealth } from '../lib/api'
import { StatCard } from '../components/StatCard'

const PIE_COLORS = ['#22c55e', '#f59e0b']

const HEALTH_COLORS: Record<string, string> = {
  HEALTHY:  'border-green-700 bg-green-950/30 text-green-400',
  WARNING:  'border-yellow-700 bg-yellow-950/30 text-yellow-400',
  CRITICAL: 'border-red-700 bg-red-950/30 text-red-400',
}

function MachineCard({ machine }: { machine: MachineHealth }) {
  const cls = HEALTH_COLORS[machine.status] ?? HEALTH_COLORS.WARNING
  return (
    <div className={`rounded-lg border p-4 ${cls}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-medium text-white">{machine.name}</div>
          <div className="text-xs opacity-60">{machine.machine_type ?? '—'}</div>
        </div>
        <div className="text-2xl font-bold">{machine.health_score}</div>
      </div>
      <div className="text-xs opacity-70 space-y-0.5">
        <div>Incidents (30d): <span className="text-white">{machine.incident_count_30d}</span></div>
        <div>Avg downtime: <span className="text-white">{machine.avg_downtime_minutes} min</span></div>
        <div className={`mt-1 font-medium ${cls.includes('green') ? 'text-green-300' : cls.includes('yellow') ? 'text-yellow-300' : 'text-red-300'}`}>
          {machine.status}
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [machines, setMachines] = useState<MachineHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchMachineHealth()])
      .then(([s, m]) => { setSummary(s); setMachines(m) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-factory-muted text-sm">
        <span className="cursor-blink mr-2">▌</span> Loading analytics…
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-950/30 border border-red-800 rounded-lg p-4 text-sm text-red-300">
        {error} — make sure Spring Boot is running on port 8080.
      </div>
    )
  }

  if (!summary) return null

  const pieData = [
    { name: 'Resolved', value: summary.resolved_count },
    { name: 'Open', value: summary.open_count },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-white">Operations Dashboard</h1>
        <p className="text-xs text-factory-muted mt-1">Live KPIs — all incidents logged through FactoryFlow AI</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Incidents" value={summary.total_incidents} color="blue" />
        <StatCard
          label="Avg MTTR"
          value={`${summary.avg_mttr_minutes.toFixed(0)} min`}
          sub="mean time to resolve"
          color="yellow"
        />
        <StatCard
          label="Fast-Path Rate"
          value={`${summary.fast_path_pct.toFixed(0)}%`}
          sub={`${summary.fast_path_count} instant resolutions`}
          color="green"
        />
        <StatCard
          label="Time Saved"
          value={`${Math.round(summary.estimated_minutes_saved / 60)} hrs`}
          sub={`${summary.total_reuse_events} knowledge reuses`}
          color="purple"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Alarm frequency bar chart */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-5">
          <div className="text-xs text-factory-muted uppercase tracking-widest mb-4">
            Top Alarms by Frequency
          </div>
          {summary.top_alarms.length === 0 ? (
            <div className="text-center py-10 text-factory-muted text-xs">No incident data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.top_alarms} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis dataKey="alarm_code" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 6 }}
                  labelStyle={{ color: '#e5e7eb' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resolution status pie */}
        <div className="bg-factory-panel border border-factory-border rounded-lg p-5">
          <div className="text-xs text-factory-muted uppercase tracking-widest mb-4">
            Incident Status
          </div>
          {summary.total_incidents === 0 ? (
            <div className="text-center py-10 text-factory-muted text-xs">No incident data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 6 }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Legend
                  formatter={(v) => <span className="text-xs text-gray-400">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Knowledge stats */}
      <div className="bg-factory-panel border border-factory-border rounded-lg p-5">
        <div className="text-xs text-factory-muted uppercase tracking-widest mb-4">
          Knowledge Base — Compounding Value
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{summary.total_knowledge_entries}</div>
            <div className="text-xs text-factory-muted mt-1">known fixes stored</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{summary.total_reuse_events}</div>
            <div className="text-xs text-factory-muted mt-1">times fast-path used</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {Math.round(summary.estimated_minutes_saved / 60)}h
            </div>
            <div className="text-xs text-factory-muted mt-1">estimated time saved</div>
          </div>
        </div>
      </div>

      {/* Machine health board */}
      {machines.length > 0 && (
        <div>
          <div className="text-xs text-factory-muted uppercase tracking-widest mb-4">
            Machine Health (last 30 days)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {machines.map((m) => (
              <MachineCard key={m.id} machine={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
