'use client'

import React, { useState, useEffect } from 'react'
import { CollapsibleSidebar } from '@/components/layout/CollapsibleSidebar'
import { motion } from 'framer-motion'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isMobile, setIsMobile] = useState(false)

  // Écouter les changements de taille sidebar
  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkWidth()
    window.addEventListener('resize', checkWidth)
    
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  // Observer la largeur réelle de la sidebar
  useEffect(() => {
    const sidebar = document.querySelector('[data-sidebar]')
    if (!sidebar) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSidebarWidth(entry.contentRect.width)
      }
    })

    observer.observe(sidebar)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Sidebar */}
      <div data-sidebar>
        <CollapsibleSidebar />
      </div>

      {/* Main Content */}
      <motion.main
        animate={{
          marginLeft: isMobile ? 0 : 0, // Sidebar est absolute sur mobile
          width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1"
      >
        {children}
      </motion.main>
    </div>
  )
}