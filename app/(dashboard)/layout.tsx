// app/(dashboard)/layout.tsx
'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  // Routes qui doivent être fullscreen (sans sidebar)
  const fullscreenRoutes = [
    '/visions/builder',
    '/visions/new'
  ]

  const isFullscreen = fullscreenRoutes.some(route => pathname.startsWith(route))

  if (isFullscreen) {
    // Fullscreen mode - pas de sidebar
    return (
      <div className="h-screen w-screen overflow-hidden">
        {children}
      </div>
    )
  }

  // Mode normal avec sidebar
  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {children}
      </main>
    </div>
  )
}