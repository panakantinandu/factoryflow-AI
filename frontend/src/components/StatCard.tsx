interface Props {
  label: string
  value: string | number
  sub?: string
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
}

const COLOR_MAP = {
  blue:   'text-blue-400 bg-blue-950/30 border-blue-800/50',
  green:  'text-green-400 bg-green-950/30 border-green-800/50',
  yellow: 'text-yellow-400 bg-yellow-950/30 border-yellow-800/50',
  purple: 'text-purple-400 bg-purple-950/30 border-purple-800/50',
  red:    'text-red-400 bg-red-950/30 border-red-800/50',
}

export function StatCard({ label, value, sub, color = 'blue' }: Props) {
  return (
    <div className={`rounded-lg border p-5 ${COLOR_MAP[color]}`}>
      <div className="text-xs text-current opacity-60 uppercase tracking-widest mb-2">{label}</div>
      <div className="text-3xl font-bold text-current">{value}</div>
      {sub && <div className="text-xs text-current opacity-50 mt-1">{sub}</div>}
    </div>
  )
}
