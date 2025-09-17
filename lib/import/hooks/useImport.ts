// ==========================================
// IMPORT HOOK
// ==========================================

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ImportOrchestrator } from '../orchestrator/importOrchestrator'
import { validateFile } from '../processors/dataProcessors'
import { 
  ImportProgress, 
  ImportResult, 
  ValidationResult,
  ProcessedData 
} from '../types'

interface UseImportState {
  // File state
  file: File | null
  processedData: ProcessedData | null
  validationResult: ValidationResult | null
  
  // Status
  status: 'idle' | 'validating' | 'processing' | 'success' | 'error'
  progress: ImportProgress | null
  error: string | null
  
  // Logs
  logs: Array<{ timestamp: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>
  
  // Results
  importResult: ImportResult | null
}

interface UseImportActions {
  // File handling
  handleFileSelect: (file: File) => Promise<void>
  clearFile: () => void
  
  // Import process
  startImport: (establishmentId: string) => Promise<void>
  cancelImport: () => void
  
  // Utilities
  clearError: () => void
  downloadTemplate: () => void
}

export function useImport(): UseImportState & UseImportActions {
  const [state, setState] = useState<UseImportState>({
    file: null,
    processedData: null,
    validationResult: null,
    status: 'idle',
    progress: null,
    error: null,
    logs: [],
    importResult: null
  })
  
  const orchestratorRef = useRef<ImportOrchestrator | null>(null)
  const supabase = createClient()
  const router = useRouter()

  /**
   * Add log entry
   */
  const addLog = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, { timestamp, message, type }]
    }))
  }, [])

  /**
   * Update progress
   */
  const updateProgress = useCallback((progress: ImportProgress) => {
    setState(prev => ({ ...prev, progress }))
  }, [])

  /**
   * Handle file selection and validation
   */
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      setState(prev => ({
        ...prev,
        file: null,
        processedData: null,
        validationResult: null,
        status: 'idle',
        error: null,
        logs: [],
        importResult: null
      }))

      // Validate file
      const validation = validateFile(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      setState(prev => ({ ...prev, file, status: 'validating' }))
      addLog('Début de l\'analyse du fichier', 'info')

      // Create orchestrator and analyze file
      const orchestrator = new ImportOrchestrator(updateProgress, addLog)
      orchestratorRef.current = orchestrator

      // Since we can't expose the analyzeFile method, we'll create a simplified version
      // In practice, you might want to refactor ImportOrchestrator to allow separate analysis
      addLog('Fichier sélectionné avec succès', 'success')
      setState(prev => ({ ...prev, status: 'idle' }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setState(prev => ({ ...prev, error: errorMessage, status: 'error' }))
      addLog(errorMessage, 'error')
    }
  }, [addLog, updateProgress])

  /**
   * Clear selected file
   */
  const clearFile = useCallback(() => {
    setState(prev => ({
      ...prev,
      file: null,
      processedData: null,
      validationResult: null,
      status: 'idle',
      error: null,
      logs: [],
      importResult: null
    }))
    orchestratorRef.current = null
  }, [])

  /**
   * Start the import process
   */
  const startImport = useCallback(async (establishmentId: string) => {
    if (!state.file) {
      throw new Error('Aucun fichier sélectionné')
    }

    try {
      setState(prev => ({ ...prev, status: 'processing', error: null }))
      addLog('Début de l\'import', 'info')

      const orchestrator = new ImportOrchestrator(updateProgress, addLog)
      orchestratorRef.current = orchestrator

      const result = await orchestrator.processImport(state.file, establishmentId)

      setState(prev => ({
        ...prev,
        status: 'success',
        importResult: result
      }))

      addLog('Import terminé avec succès!', 'success')

      // Auto-redirect to dashboard after success
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }))
      addLog(errorMessage, 'error')
    }
  }, [state.file, addLog, updateProgress, router])

  /**
   * Cancel ongoing import
   */
  const cancelImport = useCallback(() => {
    if (orchestratorRef.current) {
      orchestratorRef.current.cancelImport()
      setState(prev => ({ ...prev, status: 'idle' }))
      addLog('Import annulé par l\'utilisateur', 'warning')
    }
  }, [addLog])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  /**
   * Download Excel template
   */
  const downloadTemplate = useCallback(() => {
    // This would be moved from the original component
    // For now, we'll add a placeholder
    addLog('Téléchargement du template...', 'info')
    
    // Import the template download logic here
    // downloadTemplateLogic()
    
    addLog('Template téléchargé', 'success')
  }, [addLog])

  return {
    // State
    ...state,
    
    // Actions
    handleFileSelect,
    clearFile,
    startImport,
    cancelImport,
    clearError,
    downloadTemplate
  }
}

/**
 * Hook for validation-only workflow
 */
export function useValidation() {
  const [validationState, setValidationState] = useState<{
    isValidating: boolean
    result: ValidationResult | null
    error: string | null
  }>({
    isValidating: false,
    result: null,
    error: null
  })

  const validateData = useCallback(async (data: ProcessedData) => {
    setValidationState(prev => ({ ...prev, isValidating: true, error: null }))
    
    try {
      // Create validation engine and validate
      const { ValidationEngine } = await import('../validators/validationEngine')
      const engine = new ValidationEngine()
      const result = engine.validate(data)
      
      setValidationState({
        isValidating: false,
        result,
        error: null
      })
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de validation'
      setValidationState({
        isValidating: false,
        result: null,
        error: errorMessage
      })
      throw error
    }
  }, [])

  return {
    ...validationState,
    validateData
  }
}