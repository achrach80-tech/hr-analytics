'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserPlus,
  Eye,
  Plus,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy
} from 'lucide-react'

interface DemoRequest {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  employee_count: string
  industry: string
  country: string
  message: string
  status: string
  qualification_score: number
  created_at: string
  updated_at: string
  converted_to_company_id: string | null
}

interface Company {
  id: string
  nom: string
  code_entreprise: string
  billing_email: string
  access_token: string
  subscription_status: string
  created_at: string
}

export default function AdminDashboard() {
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null)
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  const [createCompanyData, setCreateCompanyData] = useState({
    companyName: '',
    companyCode: '',
    contactEmail: '',
    subscriptionPlan: 'trial'
  })
  const [createdCompany, setCreatedCompany] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('📋 Loading admin data...')

      // Load demo requests
      const demoResponse = await fetch('/api/admin/demo-requests')
      const demoData = await demoResponse.json()

      if (!demoResponse.ok) {
        throw new Error(demoData.error || 'Failed to load demo requests')
      }

      console.log('✅ Demo requests loaded:', demoData.data?.length)
      setDemoRequests(demoData.data || [])

      // TODO: Load companies if needed
      
    } catch (err: any) {
      console.error('❌ Error loading data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateDemoRequestStatus = async (id: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/demo-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, admin_notes: notes })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Reload data
      await loadData()
      
    } catch (err: any) {
      console.error('❌ Error updating status:', err)
      setError(err.message)
    }
  }

  const createCompanyFromDemo = async (demoRequest: DemoRequest) => {
    setCreateCompanyData({
      companyName: demoRequest.company_name,
      companyCode: demoRequest.company_name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10),
      contactEmail: demoRequest.email,
      subscriptionPlan: 'trial'
    })
    setSelectedRequest(demoRequest)
    setShowCreateCompany(true)
  }

  const handleCreateCompany = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/admin/create-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demoRequestId: selectedRequest?.id,
          ...createCompanyData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create company')
      }

      console.log('✅ Company created:', data.data)
      setCreatedCompany(data.data)
      setShowCreateCompany(false)
      
      // Reload data to see updated status
      await loadData()
      
    } catch (err: any) {
      console.error('❌ Error creating company:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'contacted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'qualified': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'converted': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'lost': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (loading && demoRequests.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Manage demo requests and create company accounts</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
            <AlertTriangle size={20} />
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400/60 hover:text-red-400"
            >
              ×
            </button>
          </div>
        )}

        {/* Success Message */}
        {createdCompany && (
          <div className="mb-6 p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3 text-green-400 mb-4">
              <CheckCircle size={20} />
              <span className="font-semibold">Company Created Successfully!</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Company:</span>
                <span className="text-white">{createdCompany.company.nom}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Access Token:</span>
                <span className="font-mono text-green-300">{createdCompany.accessToken}</span>
                <button 
                  onClick={() => copyToClipboard(createdCompany.accessToken)}
                  className="text-green-400 hover:text-green-300"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Login URL:</span>
                <a 
                  href={createdCompany.loginUrl} 
                  target="_blank" 
                  className="text-green-400 hover:text-green-300 flex items-center gap-1"
                >
                  {createdCompany.loginUrl}
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
            <button 
              onClick={() => setCreatedCompany(null)}
              className="mt-4 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-slate-400 text-sm">Total Requests</p>
                <p className="text-2xl font-bold">{demoRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-2xl font-bold">
                  {demoRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-slate-400 text-sm">Converted</p>
                <p className="text-2xl font-bold">
                  {demoRequests.filter(r => r.status === 'converted').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-slate-400 text-sm">Qualified</p>
                <p className="text-2xl font-bold">
                  {demoRequests.filter(r => r.status === 'qualified').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Demo Requests Table */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-semibold text-white">Demo Requests</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-300">Company</th>
                  <th className="text-left p-4 font-medium text-slate-300">Contact</th>
                  <th className="text-left p-4 font-medium text-slate-300">Details</th>
                  <th className="text-left p-4 font-medium text-slate-300">Status</th>
                  <th className="text-left p-4 font-medium text-slate-300">Created</th>
                  <th className="text-left p-4 font-medium text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {demoRequests.map((request) => (
                  <tr key={request.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-white">{request.company_name}</p>
                        <p className="text-sm text-slate-400">{request.industry}</p>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div>
                        <p className="text-white">{request.contact_name}</p>
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Mail size={12} />
                          {request.email}
                        </div>
                        {request.phone && (
                          <div className="flex items-center gap-1 text-sm text-slate-400">
                            <Phone size={12} />
                            {request.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-sm">
                        <p className="text-slate-400">Employees: <span className="text-white">{request.employee_count}</span></p>
                        <p className="text-slate-400">Country: <span className="text-white">{request.country}</span></p>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="text-sm text-slate-400">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        {request.status !== 'converted' && (
                          <button
                            onClick={() => createCompanyFromDemo(request)}
                            className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-1"
                          >
                            <UserPlus size={14} />
                            Create Company
                          </button>
                        )}
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateDemoRequestStatus(request.id, 'contacted')}
                            className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs"
                            title="Mark as contacted"
                          >
                            📞
                          </button>
                          <button
                            onClick={() => updateDemoRequestStatus(request.id, 'qualified')}
                            className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-xs"
                            title="Mark as qualified"
                          >
                            ⭐
                          </button>
                          <button
                            onClick={() => updateDemoRequestStatus(request.id, 'lost')}
                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs"
                            title="Mark as lost"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {demoRequests.length === 0 && (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No demo requests found</p>
                <p className="text-slate-500 text-sm">Demo requests will appear here when submitted via the demo form</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Company Modal */}
      {showCreateCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Create Company</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={createCompanyData.companyName}
                  onChange={(e) => setCreateCompanyData({...createCompanyData, companyName: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Code</label>
                <input
                  type="text"
                  value={createCompanyData.companyCode}
                  onChange={(e) => setCreateCompanyData({...createCompanyData, companyCode: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={createCompanyData.contactEmail}
                  onChange={(e) => setCreateCompanyData({...createCompanyData, contactEmail: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Subscription Plan</label>
                <select
                  value={createCompanyData.subscriptionPlan}
                  onChange={(e) => setCreateCompanyData({...createCompanyData, subscriptionPlan: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="trial">Trial (30 days)</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateCompany}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-lg text-white font-medium"
              >
                {loading ? 'Creating...' : 'Create Company'}
              </button>
              <button
                onClick={() => setShowCreateCompany(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}