// lib/hooks/useExport.ts
import { useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export type ExportFormat = 'pdf' | 'png'
export type ExportQuality = 'low' | 'medium' | 'high'

interface ExportOptions {
  format: ExportFormat
  quality?: ExportQuality
  filename?: string
  watermark?: boolean
}

interface ExportResult {
  success: boolean
  error?: string
  blob?: Blob
}

const QUALITY_SETTINGS = {
  low: { scale: 1, quality: 0.7 },
  medium: { scale: 2, quality: 0.85 },
  high: { scale: 3, quality: 0.95 }
}

export function useExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const exportElement = async (
    element: HTMLElement,
    options: ExportOptions
  ): Promise<ExportResult> => {
    try {
      setIsExporting(true)
      setProgress(10)

      const quality = options.quality || 'medium'
      const settings = QUALITY_SETTINGS[quality]

      setProgress(30)

      // ✅ OPTIONS html2canvas CORRECTES avec typage approprié
      // Note: html2canvas types peuvent ne pas inclure toutes les options
      // donc on utilise 'as any' pour les options valides mais non typées
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        // Options qui peuvent ne pas être dans les types mais sont valides
        ...({
          scale: settings.scale,
          backgroundColor: '#0f172a'
        } as any)
      })

      setProgress(60)

      // Add watermark if requested
      if (options.watermark) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.font = '20px Arial'
          ctx.fillStyle = 'rgba(6, 182, 212, 0.3)'
          ctx.textAlign = 'right'
          ctx.fillText('Talvio Analytics', canvas.width - 20, canvas.height - 20)
        }
      }

      setProgress(80)

      // Generate output
      if (options.format === 'png') {
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png', settings.quality)
        })

        downloadBlob(blob, options.filename || 'export.png')
        
        setProgress(100)
        setIsExporting(false)
        return { success: true, blob }

      } else {
        // PDF export
        const imgData = canvas.toDataURL('image/jpeg', settings.quality)
        
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        })

        pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height)
        
        const pdfBlob = pdf.output('blob')
        pdf.save(options.filename || 'export.pdf')

        setProgress(100)
        setIsExporting(false)
        return { success: true, blob: pdfBlob }
      }

    } catch (error) {
      console.error('Export error:', error)
      setIsExporting(false)
      setProgress(0)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur d\'export'
      }
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
    exportElement,
    isExporting,
    progress
  }
}

// Helper to generate filename with date
export function generateFilename(
  visionName: string,
  format: ExportFormat,
  period?: string
): string {
  const cleanName = visionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const date = period || new Date().toISOString().split('T')[0]
  return `${cleanName}_${date}.${format}`
}