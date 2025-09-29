'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, Users, Upload, Settings, LogOut,
  Menu, X, Building2, Calendar, Shield
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [company, setCompany] = useState<any>(null)
  const [establishment, setEstablishment] = useState<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    loadCompanyData()
  }, [])

const loadCompanyData = async () => {
  const sessionStr = localStorage.getItem('company_session')
  if (!sessionStr) {
    router.push('/login')
    return
  }

  try {
    const session = JSON.parse(sessionStr)
    
    // Check session expiry
    if (new Date(session.expires_at) < new Date()) {
      localStorage.removeItem('company_session')
      router.push('/login')
      return
    }
    
    // Fixed query with proper relationship syntax
    const { data: companyData, error } = await supabase
  .from('entreprises')
  .select(`
    id,
    nom,
    subscription_plan,
    subscription_status,
    trial_ends_at,
    login_count,
    features,
    etablissements (
      id,
      nom,
      code_etablissement,
      is_headquarters,
      statut
    )
  `)
  .eq('id', session.company_id)
  .single()

    if (error) {
      console.error('Company load error:', error)
      router.push('/login')
      return
    }

    if (companyData) {
      setCompany(companyData)
      
      // Get default establishment
      const establishments = companyData.etablissements || []
      const defaultEst = establishments.find((e: any) => e.is_headquarters) || establishments[0]
      
      if (defaultEst) {
        setEstablishment(defaultEst)
      }
    }
  } catch (error) {
    console.error('Session error:', error)
    localStorage.removeItem('company_session')
    router.push('/login')
  }
}

  const handleLogout = () => {
    localStorage.removeItem('company_session')
    document.cookie = 'company_session=; path=/; max-age=0'
    router.push('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Import', href: '/import', icon: Upload },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 transform transition-transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">{company?.nom || 'Loading...'}</h2>
              <p className="text-xs text-slate-400">{company?.subscription_plan}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-white border border-cyan-500/30' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="flex items-center gap-4 ml-auto">
              {company?.trial_ends_at && (
                <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm">
                  Trial ends: {new Date(company.trial_ends_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}