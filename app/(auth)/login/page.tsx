'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, Key, LogIn, AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function ClientLoginPage() {
  const [accessToken, setAccessToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Pre-fill token if provided in URL
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    if (tokenFromUrl) {
      setAccessToken(tokenFromUrl)
      setSuccess('Access token detected from invitation link')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('🔐 Attempting client login...')
      
      if (!accessToken.trim()) {
        throw new Error('Please enter your access token')
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken.trim()
        }),
        credentials: 'include'
      })

      console.log('📡 Response status:', response.status)

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Non-JSON response received')
        throw new Error('Server returned invalid response. Please check if the API endpoint exists.')
      }

      const data = await response.json()
      console.log('📄 Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || `Authentication failed (${response.status})`)
      }

      console.log('✅ Login successful!')
      setSuccess(`Welcome to ${data.company.name}! Redirecting to dashboard...`)
      
      // Store session in localStorage as backup
      if (data.session) {
        localStorage.setItem('company_session', JSON.stringify(data.session))
        console.log('💾 Session stored in localStorage')
      }

      // Small delay to show success message
      setTimeout(() => {
        console.log('🔄 Redirecting to dashboard...')
        router.push('/dashboard')
        router.refresh()
      }, 2000)

    } catch (err: any) {
      console.error('❌ Login error:', err)
      
      // Provide specific error messages
      if (err.message.includes('<!DOCTYPE')) {
        setError('API endpoint not found. Please ensure /api/auth/login exists.')
      } else if (err.message.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.')
      } else {
        setError(err.message || 'Login failed. Please check your access token.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessToken(e.target.value)
    setError(null) // Clear error when user types
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Talvio HR Analytics
          </h1>
          <p className="text-slate-400">
            Enter your access token to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Access Token */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Key size={16} />
              Access Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                required
                value={accessToken}
                onChange={handleTokenChange}
                className="w-full px-4 py-3 pr-12 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                placeholder="Enter your company access token"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
              >
                {showToken ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              This token was provided by your administrator
            </p>
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
              <div className="text-sm">
                <p className="font-medium mb-1">Login Failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !accessToken.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Access Dashboard
              </>
            )}
          </button>
        </form>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Need Help?</h3>
          <div className="text-xs text-slate-400 space-y-2">
            <p>• Your access token is a unique identifier provided by your administrator</p>
            <p>• If you don't have a token, contact your HR department</p>
            <p>• For technical support, email: support@talvio.com</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            © 2025 Talvio HR Analytics. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}