// app/admin/demos/page.tsx
// ✅ VERSION OPTIMISÉE - Évite le double chargement avec useRef

'use client'

import { useEffect, useState, useRef } from 'react'
import { 
  Calendar, Building2, User, Mail, Phone, Clock,
  CheckCircle, XCircle, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Zap, Send, Copy,
  Key, Shield, Loader2, ExternalLink, X
} from 'lucide-react'

// Modal Component
function SuccessModal({ 
  demo, 
  token, 
  company, 
  onClose 
}: { 
  demo: any
  token: string
  company: any
  onClose: () => void 
}) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendByEmail = () => {
    const subject = encodeURIComponent('Your Talvio HR Analytics Access')
    const body = encodeURIComponent(
      `Hello ${demo.contact_name},\n\n` +
      `Welcome to Talvio HR Analytics!\n\n` +
      `Your access credentials:\n` +
      `• Login URL: ${window.location.origin}/login\n` +
      `• Access Token: ${token}\n\n` +
      `Please keep your token secure and don't share it.\n\n` +
      `Best regards,\nTalvio Team`
    )
    window.open(`mailto:${demo.email}?subject=${subject}&body=${body}`, '_blank')
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-slate-900 to-slate-800 border border-green-500/30 rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
            <CheckCircle size={32} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Company Created Successfully!</h2>
            <p className="text-slate-400">Access credentials have been generated</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Company Details */}
        <div className="bg-slate-800/50 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 size={20} />
            Company Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Company Name</p>
              <p className="text-white font-medium">{company.nom}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Company Code</p>
              <p className="text-white font-mono text-sm">{company.code_entreprise}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Contact</p>
              <p className="text-white">{demo.contact_name}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Email</p>
              <p className="text-white text-sm">{demo.email}</p>
            </div>
          </div>
        </div>

        {/* Access Token */}
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Key size={20} />
            Access Token (Keep Secret!)
          </h3>
          
          <div className="space-y-4">
            {/* Token */}
            <div>
              <label className="text-slate-400 text-sm block mb-2">Access Token</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={token}
                  readOnly
                  className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white font-mono text-sm select-all"
                />
                <button
                  onClick={() => copyToClipboard(token)}
                  className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-400 transition-all"
                  title="Copy token"
                >
                  {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                </button>
              </div>
              {copied && (
                <p className="text-green-400 text-xs mt-1">✓ Copied to clipboard!</p>
              )}
            </div>

            {/* Login URL */}
            <div>
              <label className="text-slate-400 text-sm block mb-2">Login URL</label>
              <input
                type="text"
                value={`${window.location.origin}/login`}
                readOnly
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm select-all"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-all"
          >
            Close
          </button>
          <button
            onClick={sendByEmail}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Send size={20} />
            Send by Email
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminDemosPage() {
  const [demos, setDemos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDemo, setExpandedDemo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creatingCompany, setCreatingCompany] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  
  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successModalData, setSuccessModalData] = useState<{
    demo: any
    token: string
    company: any
  } | null>(null)

  // ✅ OPTIMISATION: Éviter le double chargement avec useRef
  const initialLoadDone = useRef(false)

  useEffect(() => {
    // Skip if already loaded (React Strict Mode prevention)
    if (initialLoadDone.current) return
    
    loadDemos()
    initialLoadDone.current = true
  }, []) // Empty deps - only run once

  // Reload when filter changes
  useEffect(() => {
    if (initialLoadDone.current) {
      loadDemos()
    }
  }, [filter])

  const loadDemos = async () => {
    console.log('Loading demos with filter:', filter)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/demo-requests?status=${filter}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load demos')
      }

      console.log(`✅ Loaded ${result.data?.length || 0} demos`)
      setDemos(result.data || [])
    } catch (err) {
      console.error('❌ Error loading demos:', err)
      setError(err instanceof Error ? err.message : 'Failed to load demos')
    } finally {
      setLoading(false)
    }
  }

  const updateDemoStatus = async (demoId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/demo-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: demoId, status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update demo')
      }

      loadDemos()
    } catch (err) {
      console.error('Error updating demo:', err)
      alert('Failed to update demo status')
    }
  }

  const createCompanyFromDemo = async (demo: any) => {
    setCreatingCompany(demo.id)
    
    try {
      console.log('🏢 Creating company from demo:', demo.company_name)

      const maxEmployees = 
        demo.employee_count === '1-50' ? 100 : 
        demo.employee_count === '51-200' ? 300 :
        demo.employee_count === '201-500' ? 600 : 1000

      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nom: demo.company_name,
          contact_name: demo.contact_name,
          email: demo.email,
          phone: demo.phone,
          subscription_plan: 'trial',
          trial_days: 30,
          max_employees: maxEmployees,
          employee_count: demo.employee_count
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create company')
      }

      const result = await response.json()
      console.log('✅ Company created successfully:', result.company.id)

      // Update demo status
      await fetch('/api/admin/demo-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: demo.id,
          status: 'converted',
          converted_to_company_id: result.company.id
        })
      })

      // Show success modal
      setSuccessModalData({
        demo,
        token: result.access_token,
        company: result.company
      })
      setShowSuccessModal(true)
      
      // Reload demos
      setTimeout(() => {
        setFilter('all')
        loadDemos()
      }, 1000)
      
    } catch (error) {
      console.error('❌ Company creation failed:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreatingCompany(null)
    }
  }

  const statusConfigs: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
    contacted: { label: 'Contacted', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Phone },
    scheduled: { label: 'Scheduled', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Calendar },
    demo_completed: { label: 'Demo Done', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: CheckCircle },
    converted: { label: 'Converted', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
    lost: { label: 'Lost', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle }
  }

  if (loading && !initialLoadDone.current) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading demo requests...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2 text-center">Error Loading Demos</h2>
          <p className="text-slate-400 text-center mb-4">{error}</p>
          <button
            onClick={loadDemos}
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center">
              <Sparkles size={28} />
            </div>
            Demo Requests
          </h1>
          <p className="text-slate-400">Manage and convert demo requests into active customers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total', count: demos.length, color: 'from-slate-700 to-slate-600', icon: Building2 },
            { label: 'Pending', count: demos.filter(d => d.status === 'pending').length, color: 'from-yellow-500 to-orange-500', icon: Clock },
            { label: 'Converted', count: demos.filter(d => d.status === 'converted').length, color: 'from-green-500 to-emerald-500', icon: CheckCircle },
            { label: 'Lost', count: demos.filter(d => d.status === 'lost').length, color: 'from-red-500 to-pink-500', icon: XCircle }
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <div className="text-3xl font-bold text-white">{stat.count}</div>
              </div>
              <p className="text-slate-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'contacted', 'scheduled', 'demo_completed', 'converted', 'lost'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                filter === status
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {status === 'all' ? 'All' : statusConfigs[status]?.label || status}
              {status !== 'all' && (
                <span className="ml-2 px-2 py-0.5 bg-black/20 rounded-full text-xs">
                  {demos.filter(d => d.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Demo List */}
        <div className="space-y-4">
          {demos.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl">
              <Building2 size={64} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No demo requests found</p>
            </div>
          ) : (
            demos.map(demo => {
              const config = statusConfigs[demo.status] || statusConfigs.pending
              const isExpanded = expandedDemo === demo.id
              const isCreating = creatingCompany === demo.id

              return (
                <div
                  key={demo.id}
                  className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-white">{demo.company_name}</h3>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <User size={16} />
                          <span>{demo.contact_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail size={16} />
                          <span>{demo.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Building2 size={16} />
                          <span>{demo.employee_count} employees</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={16} />
                          <span>{new Date(demo.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!demo.converted_to_company_id && (
                        <button
                          onClick={() => createCompanyFromDemo(demo)}
                          disabled={isCreating}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-50 rounded-xl text-white font-medium transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="animate-spin" size={18} />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Zap size={18} />
                              Create Company
                            </>
                          )}
                        </button>
                      )}

                      {demo.status === 'pending' && (
                        <button
                          onClick={() => updateDemoStatus(demo.id, 'contacted')}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-400 font-medium transition-all"
                        >
                          Mark Contacted
                        </button>
                      )}
                      
                      {demo.converted_to_company_id && (
                        <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 font-medium flex items-center gap-2">
                          <CheckCircle size={18} />
                          Converted
                        </div>
                      )}
                      
                      <button
                        onClick={() => setExpandedDemo(isExpanded ? null : demo.id)}
                        className="p-2 hover:bg-slate-700/50 rounded-lg transition-all"
                      >
                        {isExpanded ? <ChevronUp /> : <ChevronDown />}
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-slate-700">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="text-white font-semibold mb-3">Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Industry:</span>
                              <span className="text-slate-300">{demo.industry || 'Not specified'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Phone:</span>
                              <span className="text-slate-300">{demo.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Country:</span>
                              <span className="text-slate-300">{demo.country || 'France'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-white font-semibold mb-3">Status Flow</h4>
                          <div className="space-y-2">
                            {demo.status !== 'converted' && demo.status !== 'lost' && (
                              <>
                                {demo.status === 'pending' && (
                                  <button
                                    onClick={() => updateDemoStatus(demo.id, 'contacted')}
                                    className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm"
                                  >
                                    → Mark as Contacted
                                  </button>
                                )}
                                {demo.status === 'contacted' && (
                                  <button
                                    onClick={() => updateDemoStatus(demo.id, 'scheduled')}
                                    className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm"
                                  >
                                    → Schedule Demo
                                  </button>
                                )}
                                {demo.status === 'scheduled' && (
                                  <button
                                    onClick={() => updateDemoStatus(demo.id, 'demo_completed')}
                                    className="w-full px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm"
                                  >
                                    → Complete Demo
                                  </button>
                                )}
                                <button
                                  onClick={() => updateDemoStatus(demo.id, 'lost')}
                                  className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm"
                                >
                                  × Mark as Lost
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-white font-semibold mb-3">Timeline</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Requested:</span>
                              <span className="text-slate-300">
                                {new Date(demo.created_at).toLocaleString()}
                              </span>
                            </div>
                            {demo.updated_at && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Updated:</span>
                                <span className="text-slate-300">
                                  {new Date(demo.updated_at).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {demo.message && (
                        <div className="mt-4 p-4 bg-slate-800/50 rounded-xl">
                          <h4 className="text-white font-semibold mb-2">Message</h4>
                          <p className="text-slate-300 text-sm">{demo.message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && successModalData && (
        <SuccessModal
          demo={successModalData.demo}
          token={successModalData.token}
          company={successModalData.company}
          onClose={() => {
            setShowSuccessModal(false)
            setSuccessModalData(null)
          }}
        />
      )}
    </div>
  )
}