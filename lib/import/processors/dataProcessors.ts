// ==========================================
// DATA PROCESSING UTILITIES
// ==========================================

/**
 * Normalizes various date formats to YYYY-MM-DD
 */
export const normalizeDate = (date: any): string | null => {
  if (!date) return null
  
  try {
    // Handle Excel numeric dates
    if (typeof date === 'number' && date > 0 && date < 100000) {
      const excelDate = new Date((date - 25569) * 86400 * 1000)
      if (!isNaN(excelDate.getTime())) {
        return excelDate.toISOString().split('T')[0]
      }
    }
    
    // Handle Date objects
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
    
    const dateStr = String(date).trim()
    
    // Already in ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    
    // French format DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    // US format MM/DD/YYYY with dash
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
      const [month, day, year] = dateStr.split('-')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Normalizes period to YYYY-MM-01 format
 */
export const normalizePeriod = (period: any): string => {
  if (!period) {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }
  
  try {
    // Handle Excel numeric dates
    if (typeof period === 'number' && period > 0 && period < 100000) {
      const excelDate = new Date((period - 25569) * 86400 * 1000)
      if (!isNaN(excelDate.getTime())) {
        return `${excelDate.getFullYear()}-${String(excelDate.getMonth() + 1).padStart(2, '0')}-01`
      }
    }
    
    // Handle Date objects
    if (period instanceof Date && !isNaN(period.getTime())) {
      return `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}-01`
    }
    
    const periodStr = String(period).trim()
    
    // Already normalized
    if (/^\d{4}-\d{2}-01$/.test(periodStr)) {
      return periodStr
    }
    
    // ISO date format - extract month
    if (/^\d{4}-\d{2}-\d{2}$/.test(periodStr)) {
      return periodStr.substring(0, 7) + '-01'
    }
    
    // French format DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(periodStr)) {
      const [day, month, year] = periodStr.split('/')
      return `${year}-${month.padStart(2, '0')}-01`
    }
    
    // Month/Year format
    if (/^\d{1,2}\/\d{4}$/.test(periodStr)) {
      const [month, year] = periodStr.split('/')
      return `${year}-${month.padStart(2, '0')}-01`
    }
    
    // Default to current month
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  } catch {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }
}

/**
 * Normalizes famille absence to standardized values
 */
export const normalizeFamilleAbsence = (famille: any): string => {
  if (!famille) return 'Autres'
  
  const normalized = String(famille).trim().toLowerCase()
  
  const mapping: Record<string, string> = {
    'congé': 'Congés', 'congés': 'Congés', 'conge': 'Congés', 'conges': 'Congés',
    'cp': 'Congés', 'rtt': 'Congés', 'repos': 'Congés',
    'maladie': 'Maladie', 'arrêt': 'Maladie', 'arret': 'Maladie',
    'formation': 'Formation', 'stage': 'Formation',
    'maternité': 'Congés légaux', 'paternité': 'Congés légaux', 'parental': 'Congés légaux',
    'accident': 'Accident', 'at': 'Accident', 'mp': 'Accident',
    'familial': 'Familial', 'famille': 'Familial', 'décès': 'Familial',
    'autre': 'Autres', 'autres': 'Autres', 'divers': 'Autres'
  }
  
  for (const [key, value] of Object.entries(mapping)) {
    if (normalized.includes(key)) return value
  }
  
  return 'Autres'
}

/**
 * Sanitizes string values
 */
export const sanitizeString = (str: any, maxLength = 255): string => {
  if (!str) return ''
  return String(str).trim().substring(0, maxLength)
}

/**
 * Sanitizes numeric values
 */
export const sanitizeNumber = (val: any, defaultValue = 0): number => {
  if (val === null || val === undefined || val === '') return defaultValue
  const num = parseFloat(String(val).replace(',', '.'))
  return isNaN(num) ? defaultValue : num
}

/**
 * Parses boolean values from various formats
 */
export const parseBoolean = (val: any): boolean => {
  if (typeof val === 'boolean') return val
  const str = String(val).trim().toLowerCase()
  return ['oui', 'yes', 'true', '1', 'o', 'y'].includes(str)
}

/**
 * Generates a unique batch ID for imports
 */
export const generateBatchId = (): string => {
  return `BATCH-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

/**
 * Calculates file hash for duplicate detection
 */
export const calculateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validates file before processing
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const validTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Format de fichier non supporté. Utilisez .xlsx ou .xls' }
  }
  
  // Check file size
  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: 'Fichier trop volumineux. Maximum: 50MB' }
  }
  
  return { valid: true }
}

/**
 * Estimates processing time based on data size
 */
export const estimateProcessingTime = (recordCount: number): number => {
  // Base time + time per record
  const baseTime = 5000 // 5 seconds base
  const timePerRecord = 10 // 10ms per record
  return baseTime + (recordCount * timePerRecord)
}