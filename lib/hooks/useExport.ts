// lib/hooks/useExport.ts
import { useState } from 'react'
import jsPDF from 'jspdf'
import { visionsApi } from '@/lib/api/visions'

export type ExportFormat = 'pdf' | 'png'
export type ExportQuality = 'presentation' | 'print'

export interface ExportOptions {
  format: ExportFormat
  quality: ExportQuality
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

      // Trouver les sections
      const sections = element.querySelectorAll('.export-section')
      if (sections.length === 0) {
        throw new Error('Aucune section trouvée')
      }

      setProgress({ status: 'capturing', message: 'Capture haute résolution...', progress: 30 })

      // Configuration selon qualité
      const config = options.quality === 'presentation' 
        ? { width: 1920, scale: 2 } 
        : { width: 2400, scale: 3 }

      const images: string[] = []

      // Capturer chaque section
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement
        
        setProgress({
          status: 'capturing',
          message: `Capture section ${i + 1}/${sections.length}...`,
          progress: 30 + Math.floor((i / sections.length) * 40)
        })

        const imageData = await captureSectionHighRes(section, config.width, config.scale)
        images.push(imageData)

        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setProgress({ status: 'generating', message: 'Génération fichier...', progress: 75 })

      if (options.format === 'pdf') {
        await generatePDF(images, filename)
      } else {
        await generatePNGArchive(images, filename)
      }

      if (visionId) {
        try {
          await visionsApi.incrementExportCount(visionId)
        } catch (e) {
          console.warn('Track export failed:', e)
        }
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
        message: error instanceof Error ? error.message : 'Erreur export',
        progress: 0,
      })
      setTimeout(() => setIsExporting(false), 3000)
    }
  }

  return { exportElement, isExporting, progress }
}

// Capture section avec rendu haute résolution
async function captureSectionHighRes(
  section: HTMLElement,
  targetWidth: number,
  scale: number
): Promise<string> {
  // Import dynamique html2canvas
  const html2canvas = (await import('html2canvas')).default

  // Créer un clone de la section
  const clone = section.cloneNode(true) as HTMLElement
  
  // Container temporaire hors viewport
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    top: -10000px;
    left: 0;
    width: ${targetWidth}px;
    background: #0f172a;
    padding: 40px;
    box-sizing: border-box;
    z-index: -1000;
  `
  
  container.appendChild(clone)
  document.body.appendChild(container)

  // Attendre rendu complet
  await new Promise(resolve => setTimeout(resolve, 200))

  // Forcer tous les styles inline
  forceInlineStyles(clone)

  try {
    // Capturer avec html2canvas - utiliser 'as any' pour éviter erreurs TypeScript
    const tempCanvas = await html2canvas(container, {
      backgroundColor: '#0f172a',
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: targetWidth,
      height: container.scrollHeight
    } as any)

    // Créer canvas haute résolution
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth * scale
    canvas.height = container.scrollHeight * scale

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Canvas context failed')

    // Background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Dessiner avec scale
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height)

    return canvas.toDataURL('image/png', 1.0)

  } finally {
    // Nettoyer
    document.body.removeChild(container)
  }
}

// Forcer tous les styles computed en inline
function forceInlineStyles(element: HTMLElement): void {
  const elements = [element, ...Array.from(element.querySelectorAll('*'))]
  
  elements.forEach(el => {
    if (!(el instanceof HTMLElement)) return
    
    const computed = window.getComputedStyle(el)
    
    // Styles critiques à préserver
    const critical = [
      'background-color',
      'background-image',
      'background-size',
      'background-position',
      'background-repeat',
      'color',
      'font-size',
      'font-weight',
      'font-family',
      'padding',
      'margin',
      'border',
      'border-radius',
      'border-color',
      'width',
      'height',
      'display',
      'flex-direction',
      'align-items',
      'justify-content',
      'gap',
      'text-align'
    ]
    
    critical.forEach(prop => {
      const value = computed.getPropertyValue(prop)
      if (value && value !== 'none' && value !== 'auto' && value !== 'rgba(0, 0, 0, 0)') {
        el.style.setProperty(prop, value, 'important')
      }
    })

    // Forcer préservation couleurs
    el.style.setProperty('-webkit-print-color-adjust', 'exact', 'important')
    el.style.setProperty('print-color-adjust', 'exact', 'important')
    el.style.setProperty('color-adjust', 'exact', 'important')
  })
}

// Générer PDF optimisé PowerPoint (16:9)
async function generatePDF(images: string[], filename: string): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 167] // 16:9 ratio
  })

  const pageWidth = 297
  const pageHeight = 167

  for (let i = 0; i < images.length; i++) {
    if (i > 0) pdf.addPage()

    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = images[i]
    })

    // Calculer dimensions pour remplir la page
    const imgRatio = img.width / img.height
    const pageRatio = pageWidth / pageHeight

    let imgWidth = pageWidth
    let imgHeight = pageHeight
    let xOffset = 0
    let yOffset = 0

    if (imgRatio > pageRatio) {
      // Image plus large
      imgHeight = pageWidth / imgRatio
      yOffset = (pageHeight - imgHeight) / 2
    } else {
      // Image plus haute
      imgWidth = pageHeight * imgRatio
      xOffset = (pageWidth - imgWidth) / 2
    }

    pdf.addImage(images[i], 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST')
    
    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(148, 163, 184)
    pdf.text(`Section ${i + 1} / ${images.length}`, pageWidth / 2, pageHeight - 5, { align: 'center' })
  }

  pdf.save(`${filename}.pdf`)
}

// Générer PNG séparés (1 image par section)
async function generatePNGArchive(images: string[], filename: string): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    const link = document.createElement('a')
    link.href = images[i]
    link.download = `${filename}_section_${i + 1}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}