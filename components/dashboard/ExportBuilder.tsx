'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Download, GripVertical, FileText, Image, X } from 'lucide-react'
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

  const toggleCard = useCallback((id: string) => {
    setCards(prev => prev.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ))
  }, [])

  const toggleAll = useCallback(() => {
    const allSelected = cards.every(c => c.selected)
    setCards(prev => prev.map(c => ({ ...c, selected: !allSelected })))
  }, [cards])

  const captureCard = async (elementId: string): Promise<string> => {
    const element = document.getElementById(elementId)
    if (!element) throw new Error(`Element ${elementId} not found`)

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#0f172a',
      logging: false,
      useCORS: true
    })

    return canvas.toDataURL('image/png')
  }

  const exportPDF = async () => {
    setIsExporting(true)
    setProgress(0)

    try {
      const selectedCards = cards.filter(c => c.selected)
      if (selectedCards.length === 0) {
        alert('Veuillez sélectionner au moins une carte')
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
      pdf.text(`Période: ${new Date(period).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`, 148.5, 115, { align: 'center' })
      
      pdf.setFontSize(10)
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 148.5, 190, { align: 'center' })
      pdf.text('Talvio Analytics', 148.5, 195, { align: 'center' })

      // Pages de données
      for (let i = 0; i < selectedCards.length; i++) {
        const card = selectedCards[i]
        setProgress(Math.round(((i + 1) / selectedCards.length) * 100))

        pdf.addPage()
        
        // Header
        pdf.setFillColor(15, 23, 42)
        pdf.rect(0, 0, 297, 20, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(14)
        pdf.text(card.title, 10, 12)
        pdf.setFontSize(10)
        pdf.setTextColor(148, 163, 184)
        pdf.text(period, 287, 12, { align: 'right' })

        // Capture de la card
        const imageData = await captureCard(card.elementId)
        
        const imgWidth = 277
        const imgHeight = 155
        pdf.addImage(imageData, 'PNG', 10, 25, imgWidth, imgHeight)

        // Footer
        pdf.setFontSize(8)
        pdf.setTextColor(100, 116, 139)
        pdf.text(`Page ${i + 2}/${selectedCards.length + 1}`, 148.5, 205, { align: 'center' })
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
      alert('Erreur lors de l\'export. Veuillez réessayer.')
      setIsExporting(false)
    }
  }

  const exportImages = async () => {
    setIsExporting(true)
    setProgress(0)

    try {
      const selectedCards = cards.filter(c => c.selected)
      
      for (let i = 0; i < selectedCards.length; i++) {
        const card = selectedCards[i]
        setProgress(Math.round(((i + 1) / selectedCards.length) * 100))

        const imageData = await captureCard(card.elementId)
        
        const link = document.createElement('a')
        link.download = `${card.title.replace(/\s/g, '_')}_${period}.png`
        link.href = imageData
        link.click()
      }

      setProgress(100)
      setTimeout(() => {
        setIsExporting(false)
        onClose()
      }, 500)

    } catch (error) {
      console.error('Export error:', error)
      alert('Erreur lors de l\'export. Veuillez réessayer.')
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
                  {cards.every(c => c.selected) ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>

              <Reorder.Group
                axis="y"
                values={cards}
                onReorder={setCards}
                className="space-y-2"
              >
                {cards.map((card) => (
                  <Reorder.Item
                    key={card.id}
                    value={card}
                    className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 cursor-move hover:bg-slate-800 transition-colors"
                  >
                    <GripVertical className="text-slate-500" size={20} />
                    <input
                      type="checkbox"
                      checked={card.selected}
                      onChange={() => toggleCard(card.id)}
                      className="w-4 h-4 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className={`flex-1 ${card.selected ? 'text-white' : 'text-slate-500'}`}>
                      {card.title}
                    </span>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
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
              {cards.filter(c => c.selected).length} carte(s) sélectionnée(s)
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
                disabled={isExporting || cards.filter(c => c.selected).length === 0}
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