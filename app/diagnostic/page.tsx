'use client'

import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function DiagnosticPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (test: string, passed: boolean, message: string, data?: any) => {
    setResults(prev => [...prev, { test, passed, message, data, time: new Date().toISOString() }])
  }

  const runDiagnostics = async () => {
    setResults([])
    setLoading(true)

    try {
      // TEST 1: Check environment variables
      addResult(
        'Environment Variables',
        !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Checking if Supabase URL and anon key are set',
        {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL
        }
      )

      // TEST 2: Check session in localStorage
      const sessionStr = localStorage.getItem('company_session')
      const session = sessionStr ? JSON.parse(sessionStr) : null
      addResult(
        'Session in localStorage',
        !!session,
        session ? 'Session found in localStorage' : 'No session in localStorage',
        {
          hasSession: !!session,
          companyId: session?.company_id,
          hasToken: !!session?.access_token,
          tokenPreview: session?.access_token?.substring(0, 20) + '...',
          expiresAt: session?.expires_at
        }
      )

      if (!session?.access_token) {
        addResult('STOP', false, 'Cannot continue without session token. Please login first.', null)
        setLoading(false)
        return
      }

      // TEST 3: Create Supabase client with token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            'x-company-token': session.access_token
          }
        }
      })

      addResult(
        'Supabase Client Creation',
        true,
        'Client created with x-company-token header',
        {
          tokenInHeaders: true,
          tokenLength: session.access_token.length
        }
      )

      // TEST 4: Test get_company_id() function
      try {
        const { data: functionTest, error: functionError } = await supabase
          .rpc('check_user_permissions')
        
        addResult(
          'RLS Function Test (check_user_permissions)',
          !functionError,
          functionError ? `Function error: ${functionError.message}` : 'Function executed successfully',
          {
            data: functionTest,
            error: functionError
          }
        )
      } catch (err: any) {
        addResult(
          'RLS Function Test',
          false,
          `Function not found or error: ${err.message}`,
          { error: err }
        )
      }

      // TEST 5: Query entreprises table with token
      const { data: companyData, error: companyError } = await supabase
        .from('entreprises')
        .select('id, nom, subscription_status, subscription_plan')
        .eq('id', session.company_id)
        .single()

      addResult(
        'Query entreprises table',
        !companyError,
        companyError ? `Error: ${companyError.message} (Code: ${companyError.code})` : 'Company data retrieved successfully',
        {
          success: !companyError,
          data: companyData,
          error: companyError,
          errorDetails: companyError ? {
            message: companyError.message,
            code: companyError.code,
            details: companyError.details,
            hint: companyError.hint
          } : null
        }
      )

      // TEST 6: Query etablissements table
      if (!companyError) {
        const { data: etablissements, error: etabError } = await supabase
          .from('etablissements')
          .select('id, nom, is_headquarters')
          .eq('entreprise_id', session.company_id)

        addResult(
          'Query etablissements table',
          !etabError,
          etabError ? `Error: ${etabError.message}` : `Found ${etablissements?.length || 0} establishment(s)`,
          {
            success: !etabError,
            count: etablissements?.length || 0,
            data: etablissements,
            error: etabError
          }
        )
      }

      // TEST 7: Test direct connection with service_role (if available)
      addResult(
        'Diagnostic Complete',
        true,
        'All tests completed. Check results above.',
        null
      )

    } catch (err: any) {
      addResult(
        'Unexpected Error',
        false,
        `Unexpected error during diagnostics: ${err.message}`,
        { error: err }
      )
    } finally {
      setLoading(false)
    }
  }

  const testDirectQuery = async () => {
    const sessionStr = localStorage.getItem('company_session')
    const session = sessionStr ? JSON.parse(sessionStr) : null
    
    if (!session?.access_token) {
      alert('No session found. Please login first.')
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/entreprises?id=eq.${session.company_id}`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'x-company-token': session.access_token
          }
        }
      )

      const data = await response.json()
      
      addResult(
        'Direct REST API Test',
        response.ok,
        response.ok ? 'Direct API call succeeded' : `API call failed: ${response.status}`,
        {
          status: response.status,
          statusText: response.statusText,
          data: data,
          headers: {
            'x-company-token': session.access_token.substring(0, 20) + '...'
          }
        }
      )
    } catch (err: any) {
      addResult(
        'Direct REST API Test',
        false,
        `Failed: ${err.message}`,
        { error: err }
      )
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            🔍 Dashboard Diagnostic Tool
          </h1>
          <p className="text-slate-400">
            This tool will test each step of the authentication and data loading process
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex gap-4">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg font-medium"
            >
              {loading ? 'Running Tests...' : 'Run Full Diagnostics'}
            </button>
            
            <button
              onClick={testDirectQuery}
              disabled={loading}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white rounded-lg font-medium"
            >
              Test Direct API Call
            </button>

            <button
              onClick={() => setResults([])}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium"
            >
              Clear Results
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {results.map((result, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-4 ${
                result.passed
                  ? 'bg-green-900/20 border border-green-700'
                  : 'bg-red-900/20 border border-red-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {result.passed ? '✅' : '❌'}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {result.test}
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(result.time).toLocaleTimeString()}
                </span>
              </div>
              
              <p className={`mb-3 ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
                {result.message}
              </p>
              
              {result.data && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-300">
                    Show Details
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-950 rounded text-xs text-slate-300 overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-lg">
              Click "Run Full Diagnostics" to test your connection
            </p>
          </div>
        )}
      </div>
    </div>
  )
}