'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Download, GripVertical, FileText, Image, X, AlertCircle } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ExportCard {
  id: string
  title: string
  elementId: string
  selected: boolean
  category: 'workforce' | 'payroll' | 'demographics' | 'absences'
}

interface ExportBuilderProps {
  isOpen: boolean
  onClose: () => void
  period: string
  establishmentName: string
}

const AVAILABLE_CARDS: Omit<ExportCard, 'selected'>[] = [
  { id: 'effectifs', title: 'Effectifs & Mouvements', elementId: 'card-workforce', category: 'workforce' },
  { id: 'turnover', title: 'Taux de Turnover', elementId: 'card-turnover', category: 'workforce' },
  { id: 'age-pyramid', title: 'Pyramide des Âges', elementId: 'card-age-pyramid', category: 'demographics' },
  { id: 'seniority-pyramid', title: 'Pyramide des Anciennetés', elementId: 'card-seniority-pyramid', category: 'demographics' },
  { id: 'gender', title: 'Répartition par Sexe', elementId: 'card-gender', category: 'demographics' },
  { id: 'payroll', title: 'Masse Salariale', elementId: 'card-payroll', category: 'payroll' },
  { id: 'waterfall', title: 'Waterfall Prix/Volume/Mix', elementId: 'card-waterfall', category: 'payroll' },
  { id: 'absences', title: 'Absences', elementId: 'card-absences', category: 'absences' }
]

export const ExportBuilder: React.FC<ExportBuilderProps> = ({
  isOpen,
  onClose,
  period,
  establishmentName
}) => {
  const [cards, setCards] = useState<ExportCard[]>(
    AVAILABLE_CARDS.map(card => ({ ...card, selected: true }))
  )
  const [format, setFormat] = useState<'pdf' | 'images'>('pdf')
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [availableCards, setAvailableCards] = useState<string[]>([])

  // ✅ Vérifier quelles cartes sont disponibles dans le DOM
  const checkAvailableCards = useCallback(() => {
    const available: string[] = []
    AVAILABLE_CARDS.forEach(card => {
      const element = document.getElementById(card.elementId)
      if (element) {
        available.push(card.id)
      }
    })
    setAvailableCards(available)
    
    // Désélectionner automatiquement les cartes non disponibles
    setCards(prev => prev.map(c => ({
      ...c,
      selected: c.selected && available.includes(c.id)
    })))
  }, [])

  // Vérifier les cartes disponibles quand le modal s'ouvre
  React.useEffect(() => {
    if (isOpen) {
      // Attendre un peu que le DOM soit stable
      setTimeout(checkAvailableCards, 300)
    }
  }, [isOpen, checkAvailableCards])

  const toggleCard = useCallback((id: string) => {
    setCards(prev => prev.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ))
  }, [])

  const toggleAll = useCallback(() => {
    const allSelected = cards.filter(c => availableCards.includes(c.id)).every(c => c.selected)
    setCards(prev => prev.map(c => ({
      ...c,
      selected: availableCards.includes(c.id) ? !allSelected : false
    })))
  }, [cards, availableCards])

  const captureCard = async (elementId: string, cardTitle: string): Promise<string> => {
    const element = document.getElementById(elementId)
    
    if (!element) {
      throw new Error(`Carte "${cardTitle}" introuvable dans le dashboard. Assurez-vous qu'elle est visible.`)
    }

    try {
      // Scroll vers l'élément pour s'assurer qu'il est visible
      element.scrollIntoView({ behavior: 'instant', block: 'center' })
      
      // Attendre que les images soient chargées
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0f172a',
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById(elementId)
          if (clonedElement) {
            // Forcer la visibilité
            clonedElement.style.display = 'block'
            clonedElement.style.visibility = 'visible'
          }
        }
      })

      return canvas.toDataURL('image/png')
    } catch (err) {
      throw new Error(`Erreur lors de la capture de "${cardTitle}": ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    }
  }

  const exportPDF = async () => {
    setIsExporting(true)
    setProgress(0)
    setError(null)

    try {
      const selectedCards = cards.filter(c => c.selected && availableCards.includes(c.id))
      
      if (selectedCards.length === 0) {
        setError('Veuillez sélectionner au moins une carte disponible')
        setIsExporting(false)
        return
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      // Page de couverture
      pdf.setFillColor(15, 23, 42)
      pdf.rect(0, 0, 297, 210, 'F')
      
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(32)
      pdf.text('RAPPORT RH', 148.5, 80, { align: 'center' })
      
      pdf.setFontSize(18)
      pdf.text(establishmentName, 148.5, 100, { align: 'center' })
      
      pdf.setFontSize(14)
      pdf.setTextColor(148, 163, 184)
      const periodDate = new Date(period)
      const periodText = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(periodDate)
      pdf.text(`Période: ${periodText}`, 148.5, 115, { align: 'center' })
      
      pdf.setFontSize(10)
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 148.5, 190, { align: 'center' })
      pdf.text('Talvio Analytics', 148.5, 195, { align: 'center' })

      // Pages de données
      for (let i = 0; i < selectedCards.length; i++) {
        const card = selectedCards[i]
        setProgress(Math.round(((i + 1) / selectedCards.length) * 100))

        try {
          pdf.addPage()
          
          // Header
          pdf.setFillColor(15, 23, 42)
          pdf.rect(0, 0, 297, 20, 'F')
          pdf.setTextColor(255, 255, 255)
          pdf.setFontSize(14)
          pdf.text(card.title, 10, 12)
          pdf.setFontSize(10)
          pdf.setTextColor(148, 163, 184)
          pdf.text(periodText, 287, 12, { align: 'right' })

          // Capture de la card
          const imageData = await captureCard(card.elementId, card.title)
          
          const imgWidth = 277
          const imgHeight = 155
          pdf.addImage(imageData, 'PNG', 10, 25, imgWidth, imgHeight)

          // Footer
          pdf.setFontSize(8)
          pdf.setTextColor(100, 116, 139)
          pdf.text(`Page ${i + 2}/${selectedCards.length + 1}`, 148.5, 205, { align: 'center' })
        } catch (cardError) {
          console.error(`Erreur carte ${card.title}:`, cardError)
          // Continuer avec les autres cartes
          
          // Ajouter une page d'erreur
          pdf.setTextColor(239, 68, 68)
          pdf.setFontSize(12)
          pdf.text(`Erreur lors de la capture de "${card.title}"`, 148.5, 105, { align: 'center' })
          pdf.setFontSize(10)
          pdf.text('Cette carte a été ignorée.', 148.5, 115, { align: 'center' })
        }
      }

      const filename = `Rapport_RH_${establishmentName.replace(/\s/g, '_')}_${period}.pdf`
      pdf.save(filename)

      setProgress(100)
      setTimeout(() => {
        setIsExporting(false)
        onClose()
      }, 500)

    } catch (error) {
      console.error('Export error:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'export. Veuillez réessayer.')
      setIsExporting(false)
    }
  }

  const exportImages = async () => {
    setIsExporting(true)
    setProgress(0)
    setError(null)

    try {
      const selectedCards = cards.filter(c => c.selected && availableCards.includes(c.id))
      
      if (selectedCards.length === 0) {
        setError('Veuillez sélectionner au moins une carte disponible')
        setIsExporting(false)
        return
      }
      
      for (let i = 0; i < selectedCards.length; i++) {
        const card = selectedCards[i]
        setProgress(Math.round(((i + 1) / selectedCards.length) * 100))

        try {
          const imageData = await captureCard(card.elementId, card.title)
          
          const link = document.createElement('a')
          link.download = `${card.title.replace(/\s/g, '_')}_${period}.png`
          link.href = imageData
          link.click()
          
          // Attendre un peu entre chaque téléchargement
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (cardError) {
          console.error(`Erreur carte ${card.title}:`, cardError)
          // Continuer avec les autres cartes
        }
      }

      setProgress(100)
      setTimeout(() => {
        setIsExporting(false)
        onClose()
      }, 500)

    } catch (error) {
      console.error('Export error:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors de l\'export. Veuillez réessayer.')
      setIsExporting(false)
    }
  }

  const handleExport = () => {
    if (format === 'pdf') {
      exportPDF()
    } else {
      exportImages()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Download className="text-cyan-400" size={28} />
                Exporter votre rapport
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Sélectionnez les cartes à inclure et organisez-les
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="text-slate-400" size={20} />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-red-300 font-medium text-sm">Erreur d'export</p>
                <p className="text-red-400/80 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}

          {/* Body */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Sélection des cartes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Cartes à exporter</h3>
                <button
                  onClick={toggleAll}
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  {cards.filter(c => availableCards.includes(c.id)).every(c => c.selected) ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>

              <Reorder.Group
                axis="y"
                values={cards}
                onReorder={setCards}
                className="space-y-2"
              >
                {cards.map((card) => {
                  const isAvailable = availableCards.includes(card.id)
                  
                  return (
                    <Reorder.Item
                      key={card.id}
                      value={card}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isAvailable
                          ? 'bg-slate-800/50 border-slate-700/50 cursor-move hover:bg-slate-800'
                          : 'bg-slate-900/50 border-slate-800/50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <GripVertical className="text-slate-500" size={20} />
                      <input
                        type="checkbox"
                        checked={card.selected && isAvailable}
                        onChange={() => isAvailable && toggleCard(card.id)}
                        disabled={!isAvailable}
                        className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500 disabled:opacity-30"
                      />
                      <span className={`flex-1 ${card.selected && isAvailable ? 'text-white' : 'text-slate-500'}`}>
                        {card.title}
                        {!isAvailable && (
                          <span className="ml-2 text-xs text-amber-400">(non disponible)</span>
                        )}
                      </span>
                    </Reorder.Item>
                  )
                })}
              </Reorder.Group>
              
              {availableCards.length === 0 && (
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-amber-300 text-sm">
                    ⚠️ Aucune carte disponible. Assurez-vous que le dashboard est complètement chargé.
                  </p>
                </div>
              )}
            </div>

            {/* Format */}
            <div>
              <h3 className="text-white font-semibold mb-3">Format d'export</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormat('pdf')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    format === 'pdf'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <FileText className={`mx-auto mb-2 ${format === 'pdf' ? 'text-cyan-400' : 'text-slate-400'}`} size={32} />
                  <div className={`font-semibold ${format === 'pdf' ? 'text-white' : 'text-slate-400'}`}>
                    PDF
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Recommandé</div>
                </button>

                <button
                  onClick={() => setFormat('images')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    format === 'images'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <Image className={`mx-auto mb-2 ${format === 'images' ? 'text-cyan-400' : 'text-slate-400'}`} size={32} />
                  <div className={`font-semibold ${format === 'images' ? 'text-white' : 'text-slate-400'}`}>
                    Images PNG
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Pour PowerPoint</div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-700 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {cards.filter(c => c.selected && availableCards.includes(c.id)).length} carte(s) sélectionnée(s)
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || cards.filter(c => c.selected && availableCards.includes(c.id)).length === 0}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {progress}%
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Exporter
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

ExportBuilder.displayName = 'ExportBuilder'