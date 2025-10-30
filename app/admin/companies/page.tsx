// app/admin/companies/page.tsx
// ✅ VERSION CORRIGÉE - Utilise l'API route admin au lieu du client Supabase

'use client'

import { useEffect, useState } from 'react'
import { 
  Building2, Search, Copy, Activity, 
  Calendar, Loader2, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('📊 Loading companies via API route...')
      
      // Use admin API route (service_role)
      const response = await fetch('/api/admin/companies')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load companies')
      }

      const result = await response.json()
      console.log(`✅ Loaded ${result.data?.length || 0} companies`)
      
      setCompanies(result.data || [])
    } catch (err) {
      console.error('❌ Error loading companies:', err)
      setError(err instanceof Error ? err.message : 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  const copyToken = (token: string, companyName: string) => {
    navigator.clipboard.writeText(token)
    
    // Show toast
    const toast = document.createElement('div')
    toast.className = 'fixed bottom-4 right-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-2xl z-50 animate-slideIn'
    toast.innerHTML = `✓ Token copied for ${companyName}`
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  const filteredCompanies = companies.filter(c =>
    c.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code_entreprise?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.billing_email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading companies...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2 text-center">Error Loading Companies</h2>
          <p className="text-slate-400 text-center mb-4">{error}</p>
          <button
            onClick={loadCompanies}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-3xl" />
          <div className="relative">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2 flex items-center gap-4">
              <Building2 size={48} />
              Companies
            </h1>
            <p className="text-gray-400 text-lg">
              Manage all active client accounts • {companies.length} total
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Building2 size={24} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-white">{companies.length}</div>
            </div>
            <p className="text-slate-400 text-sm">Total Companies</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-white">
                {companies.filter(c => c.subscription_status === 'active').length}
              </div>
            </div>
            <p className="text-slate-400 text-sm">Active</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Calendar size={24} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-white">
                {companies.filter(c => c.subscription_plan === 'trial').length}
              </div>
            </div>
            <p className="text-slate-400 text-sm">Trial</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Activity size={24} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-white">
                {companies.reduce((sum, c) => sum + (c.login_count || 0), 0)}
              </div>
            </div>
            <p className="text-slate-400 text-sm">Total Logins</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, code, or email..."
              className="w-full pl-12 pr-4 py-4 bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid gap-6">
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl">
              <Building2 size={64} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">
                {searchTerm ? 'No companies found matching your search' : 'No companies yet'}
              </p>
            </div>
          ) : (
            filteredCompanies.map((company) => (
              <div key={company.id} className="group bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6 hover:border-green-500/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{company.nom}</h3>
                    <p className="text-gray-400 font-mono text-sm">{company.code_entreprise}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      company.subscription_status === 'active' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {company.subscription_status}
                    </span>
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium capitalize">
                      {company.subscription_plan}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Email</p>
                    <p className="text-white text-sm">{company.billing_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Created</p>
                    <p className="text-white text-sm">
                      {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Last Login</p>
                    <p className="text-white text-sm">
                      {company.last_login_at ? new Date(company.last_login_at).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Trial Ends</p>
                    <p className="text-white text-sm">
                      {company.trial_ends_at ? new Date(company.trial_ends_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div className="flex gap-4">
                    <button
                      onClick={() => copyToken(company.access_token, company.nom)}
                      className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm font-medium transition-all flex items-center gap-2"
                    >
                      <Copy size={16} />
                      Copy Token
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Activity size={16} />
                      <span className="text-xs">{company.login_count || 0} logins</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Building2 size={16} />
                      <span className="text-xs">Max: {company.max_employees || 100} emp.</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}