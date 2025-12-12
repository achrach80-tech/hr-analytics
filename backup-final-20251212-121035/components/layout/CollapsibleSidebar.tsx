// components/layout/CollapsibleSidebar.tsx
// ✅ Sidebar avec callback de largeur + Import + Déconnexion Supabase

'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3,
  Upload,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Menu,
  X
} from 'lucide-react'

interface CollapsibleSidebarProps {
  onWidthChange?: (width: number) => void
}

export function CollapsibleSidebar({ onWidthChange }: CollapsibleSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Notifier le parent du changement de largeur
  useEffect(() => {
    if (onWidthChange && !isMobile) {
      onWidthChange(isCollapsed ? 80 : 280)
    }
  }, [isCollapsed, isMobile, onWidthChange])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Erreur déconnexion Supabase:', error)
      }
      
      localStorage.removeItem('auth_token')
      localStorage.removeItem('company_session')
      localStorage.removeItem('current_etablissement_id')
      
      router.push('/login')
      router.refresh()
      
    } catch (error) {
      console.error('Erreur déconnexion:', error)
      router.push('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      path: '/dashboard',
      gradient: 'from-purple-500 to-cyan-500'
    },
    {
      id: 'visions',
      label: 'Visions',
      icon: Eye,
      path: '/visions',
      gradient: 'from-cyan-500 to-blue-500',
      badge: 'NEW'
    },
    {
      id: 'import',
      label: 'Import',
      icon: Upload,
      path: '/import',
      gradient: 'from-green-500 to-emerald-500'
    }
  ]

  const isActive = (path: string) => pathname?.startsWith(path)

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <motion.div
          className="flex items-center gap-3"
          animate={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Talvio
                </h1>
                <p className="text-xs text-slate-400">HR Analytics</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <motion.button
              key={item.id}
              onClick={() => {
                router.push(item.path)
                if (isMobile) setIsMobileOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden group ${
                active
                  ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              {active && (
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  layoutId="activeTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              <Icon className={`w-5 h-5 relative z-10 ${isCollapsed ? 'mx-auto' : ''}`} />
              
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 text-left font-medium relative z-10 overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>

              {item.badge && !isCollapsed && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full relative z-10"
                >
                  {item.badge}
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        <motion.button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isLoggingOut
              ? 'text-slate-500 cursor-not-allowed'
              : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
          }`}
          whileHover={!isLoggingOut ? { scale: 1.02 } : {}}
          whileTap={!isLoggingOut ? { scale: 0.98 } : {}}
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''} ${isLoggingOut ? 'animate-pulse' : ''}`} />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-medium overflow-hidden whitespace-nowrap"
              >
                {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {!isMobile && (
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Réduire</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  )

  // Mobile view
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-3 bg-slate-900 border border-slate-700 rounded-xl text-white hover:bg-slate-800 transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>

        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className="fixed left-0 top-0 bottom-0 w-[280px] bg-slate-900 border-r border-slate-700 z-50"
              >
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Desktop view - FIXED position mais le Layout gère le margin
  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 bottom-0 bg-slate-900 border-r border-slate-700/50 overflow-hidden z-40"
    >
      <SidebarContent />
    </motion.aside>
  )
}