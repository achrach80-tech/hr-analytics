// app/(dashboard)/layout.tsx
// ✅ Layout avec sidebar qui décale le contenu (pas d'overlay)
// ✅ Fix hydratation avec useEffect

'use client'

import { usePathname } from 'next/navigation'
import { ReactNode, useState, useEffect } from 'react'
import { CollapsibleSidebar } from '@/components/layout/CollapsibleSidebar'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isMounted, setIsMounted] = useState(false)

  // Fix hydratation : attendre que le composant soit monté côté client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Routes qui doivent être fullscreen (sans sidebar)
  const fullscreenRoutes = [
    '/visions/builder',
    '/visions/new'
  ]

  const isFullscreen = fullscreenRoutes.some(route => pathname.startsWith(route))

  if (isFullscreen) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        {children}
      </div>
    )
  }

  // Mode normal avec sidebar qui décale le contenu
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <CollapsibleSidebar onWidthChange={setSidebarWidth} />
      
      <main 
        className="flex-1 overflow-auto transition-all duration-300"
        style={{ marginLeft: isMounted ? `${sidebarWidth}px` : '280px' }}
      >
        {children}
      </main>
    </div>
  )
}