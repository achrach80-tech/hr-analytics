'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Upload, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  LogOut
} from 'lucide-react'

interface SidebarProps {
  userName?: string
  userPlan?: string
}

export const CollapsibleSidebar: React.FC<SidebarProps> = ({ 
  userName = 'Ashraf Rach',
  userPlan = 'trial'
}) => {
  const router = useRouter()
  const pathname = usePathname()
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('talvio-sidebar-collapsed')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('talvio-sidebar-collapsed', JSON.stringify(isCollapsed))
    }
  }, [isCollapsed])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isMobile && isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, isMobileOpen])

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Upload, label: 'Import', path: '/import' },
    { icon: Settings, label: 'Paramètres', path: '/settings' }
  ]

  const handleLogout = () => {
    localStorage.removeItem('company_session')
    localStorage.removeItem('talvio-sidebar-collapsed')
    router.push('/login')
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden lg:flex flex-col h-screen bg-slate-900 border-r border-slate-800 relative"
    >
      {/* Toggle Button - VERSION VISIBLE */}
      <div className="absolute -right-4 top-20 z-50">
        <motion.button
          onClick={toggleSidebar}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl border-2 border-slate-900"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft size={16} className="text-white" />
          </motion.div>
        </motion.button>
      </div>

      {/* User Section */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">
              {userName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="text-white font-semibold text-sm whitespace-nowrap">{userName}</div>
                <div className="text-slate-400 text-xs whitespace-nowrap">{userPlan}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path
          const Icon = item.icon
          
          return (
            <motion.button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30'
                  : 'hover:bg-slate-800/50'
              }`}
            >
              <Icon 
                size={20} 
                className={`flex-shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} 
              />
              
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`text-sm font-medium overflow-hidden whitespace-nowrap ${
                      isActive ? 'text-white' : 'text-slate-300'
                    }`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </nav>

      {/* Collapse Button Alternative - En bas de la sidebar */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-800">
          <motion.button
            onClick={toggleSidebar}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/50 transition-all group"
          >
            <ChevronLeft size={20} className="text-slate-400 group-hover:text-purple-400 transition-colors flex-shrink-0" />
            <span className="text-sm font-medium text-slate-300 group-hover:text-purple-400 overflow-hidden whitespace-nowrap transition-colors">
              Réduire
            </span>
          </motion.button>
        </div>
      )}

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          title={isCollapsed ? 'Déconnexion' : undefined}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all group"
        >
          <LogOut size={20} className="text-slate-400 group-hover:text-red-400 transition-colors flex-shrink-0" />
          
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium text-slate-300 group-hover:text-red-400 overflow-hidden whitespace-nowrap transition-colors"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  )

  // Mobile Menu Button
  const MobileMenuButton = () => (
    <motion.button
      onClick={() => setIsMobileOpen(true)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="lg:hidden fixed top-4 left-4 z-40 w-12 h-12 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center shadow-lg"
    >
      <Menu size={20} className="text-white" />
    </motion.button>
  )

  // Mobile Drawer
  const MobileDrawer = () => (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 z-[70] flex flex-col"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {userName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{userName}</div>
                  <div className="text-slate-400 text-xs">{userPlan}</div>
                </div>
              </div>
              
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.path
                const Icon = item.icon
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon 
                      size={20} 
                      className={isActive ? 'text-purple-400' : 'text-slate-400'} 
                    />
                    <span className={`text-sm font-medium ${
                      isActive ? 'text-white' : 'text-slate-300'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all group"
              >
                <LogOut size={20} className="text-slate-400 group-hover:text-red-400 transition-colors" />
                <span className="text-sm font-medium text-slate-300 group-hover:text-red-400 transition-colors">
                  Déconnexion
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {!isMobile && <DesktopSidebar />}
      {isMobile && <MobileMenuButton />}
      {isMobile && <MobileDrawer />}
    </>
  )
}