'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, LogIn, AlertCircle, CheckCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    email: 'admin@talvio.com',
    password: 'admin123'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('🔐 Attempting admin login...')
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      })

      console.log('📡 Response status:', response.status)
      
      const data = await response.json()
      console.log('📄 Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      console.log('✅ Login successful!')
      setSuccess('Login successful! Redirecting...')
      
      // Store session in localStorage as backup
      if (data.session) {
        localStorage.setItem('admin_session', JSON.stringify(data.session))
        console.log('💾 Session stored in localStorage')
      }

      // Small delay to show success message
      setTimeout(() => {
        console.log('🔄 Redirecting to admin panel...')
        router.push('/admin')
        router.refresh()
      }, 1000)

    } catch (err: any) {
      console.error('❌ Login error:', err)
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Panel
          </h1>
          <p className="text-slate-400">
            Talvio HR Analytics - Admin Access
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Mail size={16} />
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              placeholder="admin@talvio.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Lock size={16} />
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              placeholder="admin123"
            />
          </div>

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-400">
              <CheckCircle size={20} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Credentials */}
        <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <h3 className="text-sm font-medium text-emerald-300 mb-3 flex items-center gap-2">
            <CheckCircle size={16} />
            Simple Login (No bcrypt)
          </h3>
          <div className="text-xs text-emerald-200 space-y-2">
            <div className="flex justify-between">
              <span>Email:</span>
              <span className="font-mono">admin@talvio.com</span>
            </div>
            <div className="flex justify-between">
              <span>Password:</span>
              <span className="font-mono">admin123</span>
            </div>
            <div className="text-emerald-400 text-xs mt-2">
              ✅ Credentials are hardcoded in the API for simplicity
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            © 2025 Talvio HR Analytics
          </p>
        </div>
      </div>
    </div>
  )
}