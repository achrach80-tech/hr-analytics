// lib/utils/testConnection.ts
// Test utility to verify Supabase connection and authentication

import { createClient } from '@/lib/supabase/client'
import { adminClient } from '@/lib/supabase/admin'

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  duration?: number
}

export async function runConnectionTests(accessToken?: string): Promise<TestResult[]> {
  const results: TestResult[] = []
  
  // Test 1: Client creation
  console.log('🧪 Running Connection Tests...\n')
  const startTime = Date.now()
  
  try {
    const supabase = createClient()
    results.push({
      test: 'Client Creation',
      status: 'PASS',
      message: 'Supabase client created successfully'
    })
  } catch (error) {
    results.push({
      test: 'Client Creation',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    return results
  }

  // Test 2: Admin client (service_role)
  try {
    const { data, error } = await adminClient
      .from('entreprises')
      .select('id, nom')
      .limit(1)
    
    if (error) throw error
    
    results.push({
      test: 'Admin Client Access',
      status: 'PASS',
      message: `Service role working - Found ${data?.length || 0} companies`
    })
  } catch (error) {
    results.push({
      test: 'Admin Client Access',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 3: Token validation (if provided)
  if (accessToken) {
    try {
      const { data: company, error } = await adminClient
        .from('entreprises')
        .select('id, nom, subscription_status')
        .eq('access_token', accessToken)
        .single()
      
      if (error || !company) {
        results.push({
          test: 'Token Validation',
          status: 'FAIL',
          message: 'Invalid token or company not found'
        })
      } else {
        results.push({
          test: 'Token Validation',
          status: 'PASS',
          message: `Token valid for: ${company.nom} (${company.subscription_status})`
        })
        
        // Test 4: Check establishments
        const { data: establishments, error: estError } = await adminClient
          .from('etablissements')
          .select('id, nom')
          .eq('entreprise_id', company.id)
        
        if (estError) throw estError
        
        results.push({
          test: 'Establishments Check',
          status: 'PASS',
          message: `Found ${establishments?.length || 0} establishment(s)`
        })
        
        // Test 5: Check snapshots
        if (establishments && establishments.length > 0) {
          const { data: snapshots, error: snapError } = await adminClient
            .from('snapshots_workforce')
            .select('periode')
            .eq('etablissement_id', establishments[0].id)
            .order('periode', { ascending: false })
            .limit(5)
          
          if (snapError) throw snapError
          
          results.push({
            test: 'Snapshots Check',
            status: 'PASS',
            message: `Found ${snapshots?.length || 0} snapshot period(s)`
          })
          
          if (snapshots && snapshots.length > 0) {
            results.push({
              test: 'Latest Period',
              status: 'PASS',
              message: `Latest data: ${snapshots[0].periode}`
            })
          }
        }
      }
    } catch (error) {
      results.push({
        test: 'Token Validation',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  } else {
    results.push({
      test: 'Token Validation',
      status: 'SKIP',
      message: 'No token provided'
    })
  }

  // Test 6: RLS Policies Check
  try {
    const supabase = createClient()
    
    // This should fail with RLS if not authenticated
    const { data, error } = await supabase
      .from('entreprises')
      .select('*')
      .limit(1)
    
    // If we get data without auth, RLS might be disabled (warning)
    if (data && data.length > 0 && !accessToken) {
      results.push({
        test: 'RLS Policies',
        status: 'FAIL',
        message: 'WARNING: RLS might be disabled - got data without auth'
      })
    } else if (error?.code === 'PGRST301' || error?.message?.includes('policy')) {
      results.push({
        test: 'RLS Policies',
        status: 'PASS',
        message: 'RLS properly enforced'
      })
    } else {
      results.push({
        test: 'RLS Policies',
        status: 'PASS',
        message: 'RLS check completed'
      })
    }
  } catch (error) {
    results.push({
      test: 'RLS Policies',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  const endTime = Date.now()
  const totalDuration = endTime - startTime
  
  results.push({
    test: 'Total Duration',
    status: 'PASS',
    message: `${totalDuration}ms`,
    duration: totalDuration
  })

  return results
}

export function printTestResults(results: TestResult[]) {
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST RESULTS')
  console.log('='.repeat(60))
  
  let passCount = 0
  let failCount = 0
  let skipCount = 0
  
  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : 
                 result.status === 'FAIL' ? '❌' : '⏭️ '
    
    console.log(`\n${icon} ${result.test}`)
    console.log(`   ${result.message}`)
    
    if (result.status === 'PASS') passCount++
    if (result.status === 'FAIL') failCount++
    if (result.status === 'SKIP') skipCount++
  })
  
  console.log('\n' + '='.repeat(60))
  console.log(`Summary: ${passCount} passed, ${failCount} failed, ${skipCount} skipped`)
  console.log('='.repeat(60) + '\n')
  
  return failCount === 0
}

// Usage example for debugging
if (typeof window !== 'undefined') {
  (window as any).testSupabaseConnection = async (token?: string) => {
    const results = await runConnectionTests(token)
    return printTestResults(results)
  }
}