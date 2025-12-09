// components/layout/Sidebar.tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Sparkles, 
  Settings, 
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Mes Visions', href: '/visions', icon: Sparkles },
  { name: 'Paramètres', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300`}>
      {/* Logo/Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-white font-bold text-lg">Talvio</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium">{item.name}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => router.push('/api/auth/signout')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all`}
          title={collapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}