import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Diagnose', icon: '◈' },
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/history', label: 'History', icon: '≡' },
  { to: '/knowledge', label: 'Knowledge Base', icon: '◆' },
]

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-factory-panel border-r border-factory-border flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-factory-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-factory-accent/20 border border-factory-accent/50 flex items-center justify-center">
            <span className="text-factory-accent text-xs font-bold">F</span>
          </div>
          <div>
            <div className="text-xs font-semibold text-white">FactoryFlow</div>
            <div className="text-[10px] text-factory-muted">AI Copilot</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded text-xs transition-colors ${
                isActive
                  ? 'bg-factory-accent/15 text-factory-accent border border-factory-accent/30'
                  : 'text-factory-muted hover:text-gray-300 hover:bg-white/5'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Status */}
      <div className="px-5 py-4 border-t border-factory-border">
        <div className="flex items-center gap-2 text-[10px] text-factory-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Agent online
        </div>
      </div>
    </aside>
  )
}
