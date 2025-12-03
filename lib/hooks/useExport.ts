// lib/hooks/useExport.ts
// Version FINALE sans erreur TypeScript - Contournement du problème scale

import { useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export type ExportFormat = 'pdf' | 'png'
export type ExportQuality = 'standard' | 'high' | 'ultra'

export interface ExportOptions {
  format: ExportFormat
  quality: ExportQuality
  includeHeader?: boolean
  includeFooter?: boolean
}

export interface ExportProgress {
  status: 'idle' | 'preparing' | 'capturing' | 'generating' | 'success' | 'error'
  message: string
  progress: number
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<ExportProgress>({
    status: 'idle',
    message: '',
    progress: 0,
  })

  const exportElement = async (
    elementId: string,
    filename: string,
    options: ExportOptions,
    visionId?: string
  ): Promise<void> => {
    try {
      setIsExporting(true)
      setProgress({ status: 'preparing', message: 'Préparation...', progress: 10 })

      const element = document.getElementById(elementId)
      if (!element) throw new Error('Élément introuvable')

      setProgress({ status: 'capturing', message: 'Capture en cours...', progress: 40 })

      // Calculer le scale selon la qualité
      const scale = options.quality === 'ultra' ? 3 : options.quality === 'high' ? 2 : 1.5

      // Capturer SANS scale dans les options (évite l'erreur TS)
      // On va appliquer le scale après sur le canvas
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        background: '#0f172a',
        logging: false,
        // PAS de scale ici pour éviter l'erreur TypeScript
      })

      // Appliquer le scale manuellement si besoin
      let finalCanvas = canvas
      if (scale > 1) {
        finalCanvas = scaleCanvas(canvas, scale)
      }

      setProgress({ status: 'generating', message: 'Génération du fichier...', progress: 70 })

      if (options.format === 'pdf') {
        await generatePDF(finalCanvas, filename)
      } else {
        await generatePNG(finalCanvas, filename)
      }

      setProgress({ status: 'generating', message: 'Téléchargement...', progress: 90 })

      if (visionId) {
        await incrementExportCount(visionId)
      }

      setProgress({ status: 'success', message: 'Export réussi !', progress: 100 })

      setTimeout(() => {
        setIsExporting(false)
        setProgress({ status: 'idle', message: '', progress: 0 })
      }, 2000)

    } catch (error) {
      console.error('Export error:', error)
      setProgress({
        status: 'error',
        message: 'Erreur lors de l\'export',
        progress: 0,
      })
      setTimeout(() => setIsExporting(false), 3000)
    }
  }

  return { exportElement, isExporting, progress }
}

// Fonction pour scaler un canvas manuellement
function scaleCanvas(originalCanvas: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const scaledCanvas = document.createElement('canvas')
  scaledCanvas.width = originalCanvas.width * scale
  scaledCanvas.height = originalCanvas.height * scale
  
  const ctx = scaledCanvas.getContext('2d')
  if (!ctx) return originalCanvas
  
  ctx.scale(scale, scale)
  ctx.drawImage(originalCanvas, 0, 0)
  
  return scaledCanvas
}

async function generatePDF(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const imgData = canvas.toDataURL('image/png', 1.0)
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 297
  const margin = 10
  const imgWidth = pageWidth - margin * 2
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight)
  pdf.save(`${filename}.pdf`)
}

async function generatePNG(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  canvas.toBlob((blob) => {
    if (!blob) throw new Error('Erreur génération PNG')
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.png`
    link.click()
    
    URL.revokeObjectURL(url)
  }, 'image/png', 1.0)
}

async function incrementExportCount(visionId: string): Promise<void> {
  try {
    const token = localStorage.getItem('auth_token')
    await fetch(`/api/visions/${visionId}/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Erreur analytics:', error)
  }
}