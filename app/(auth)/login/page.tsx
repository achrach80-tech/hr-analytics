// app/(auth)/login/page.tsx
// FIXED: Proper cookie and localStorage handling that matches the API

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Loader2, AlertCircle, Building2, Key, ChevronRight } from 'lucide-react'

export default function CompanyLoginPage() {
  const [accessToken, setAccessToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔐 Attempting login with token:', accessToken.substring(0, 8) + '...')

      // Call API route to validate token (uses service_role)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: accessToken.trim()
        }),
        credentials: 'include' // IMPORTANT: Include cookies in request
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur de connexion')
      }

      console.log('✅ Login successful:', result.session.company_name)

      // CRITICAL FIX: Store session in localStorage for client-side access
      // Cookie is already set by the API response
      localStorage.setItem('company_session', JSON.stringify(result.session))

      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 100))

      // Redirect to dashboard
      console.log('🚀 Redirecting to dashboard...')
      router.push('/dashboard')
      
      // Force page refresh to ensure middleware picks up the new cookie
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 100)
      
    } catch (err: any) {
      console.error('❌ Login failed:', err.message)
      setError(err.message || 'Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-purple-500/20">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Accès Entreprise
          </h1>
          <p className="text-slate-400">
            Connectez-vous avec votre code d'accès sécurisé
          </p>
        </div>

        {/* Login form */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Key size={16} />
                Code d'accès
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Entrez votre code d'accès"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                required
                disabled={isLoading}
                autoComplete="off"
                minLength={32}
              />
              <p className="mt-2 text-xs text-slate-500">
                Le code d'accès vous a été fourni par email lors de l'activation
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-in slide-in-from-top duration-300">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-400">{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !accessToken}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Accéder au Dashboard
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-400">
                Pas encore client ?
              </p>
              
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-white font-medium transition-all"
              >
                <Building2 size={16} />
                Demander une démo
              </Link>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Connexion sécurisée • Données chiffrées • Conforme RGPD
          </p>
        </div>
      </div>
    </div>
  )
}