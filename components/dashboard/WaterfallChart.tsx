'use client'

import { useWaterfallData } from '@/lib/hooks/useWaterfallData'
import type { WaterfallData } from '@/lib/types/dashboard'
import { TrendingUp, TrendingDown, MessageSquare, AlertCircle } from 'lucide-react'

interface WaterfallChartProps {
  establishmentId: string
  period: string
}

export default function WaterfallChart({ establishmentId, period }: WaterfallChartProps) {
  const { data, loading, error } = useWaterfallData(establishmentId, period)

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-xl p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement de l'analyse...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full bg-red-900/20 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-red-400 font-semibold">Erreur de chargement</h3>
        </div>
        <p className="text-red-300/80 text-sm">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full bg-slate-900/50 border border-slate-700/30 rounded-xl p-6">
        <p className="text-slate-400 text-center">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      
      {/* En-tête section */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
          Analyse Prix / Volume
        </h2>
        <p className="text-slate-400 text-sm">
          Décomposition de la variation de masse salariale
        </p>
      </div>

      {/* Grid 2 waterfalls */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Waterfall M-1 */}
        {data.hasMonthBefore && data.vsMonthBefore ? (
          <WaterfallCard
            title="vs Mois Précédent"
            data={data.vsMonthBefore}
            color="cyan"
          />
        ) : (
          <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-8 flex items-center justify-center">
            <p className="text-slate-500 text-sm">Données M-1 insuffisantes</p>
          </div>
        )}

        {/* Waterfall N-1 */}
        {data.hasYearBefore && data.vsYearBefore ? (
          <WaterfallCard
            title="vs Année Précédente"
            data={data.vsYearBefore}
            color="purple"
          />
        ) : (
          <div className="bg-slate-900/30 border border-slate-700/30 rounded-xl p-8 flex items-center justify-center">
            <p className="text-slate-500 text-sm">Historique insuffisant (&lt; 12 mois)</p>
          </div>
        )}

      </div>
    </div>
  )
}

export { WaterfallChart }

// ============================================
// WATERFALL CARD MVP CORPORATE
// ============================================
function WaterfallCard({ 
  title, 
  data, 
  color 
}: {
  title: string
  data: WaterfallData
  color: 'cyan' | 'purple'
}) {
  const colors = color === 'cyan' ? {
    border: 'border-cyan-500/20',
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500/10'
  } : {
    border: 'border-purple-500/20',
    accent: 'text-purple-400',
    bg: 'bg-purple-500/10'
  }

  // Génération des commentaires intelligents
  const comments = generateComments(data)

  return (
    <div className={`bg-slate-900/50 backdrop-blur-sm border ${colors.border} rounded-xl p-6 space-y-6`}>
      
      {/* Header */}
      <div>
        <h3 className={`text-lg font-bold ${colors.accent} mb-1`}>
          {title}
        </h3>
        <p className="text-slate-500 text-xs">
          {formatPeriod(data.periodePrecedente)} → {formatPeriod(data.periodeCourante)}
        </p>
      </div>

      {/* KPI Variation */}
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
        <div className="text-slate-400 text-xs mb-2">Variation totale</div>
        <div className={`text-3xl font-bold flex items-center gap-3 ${
          data.variation === 0 ? 'text-slate-400' :
          data.variation > 0 ? 'text-red-400' : 'text-emerald-400'
        }`}>
          {data.variation >= 0 ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
          <span>{formatEuros(data.variation, true)}</span>
        </div>
        <div className="text-slate-500 text-sm mt-1">
          {data.variationPct >= 0 ? '+' : ''}{data.variationPct.toFixed(1)}% de variation
        </div>
      </div>

      {/* WATERFALL EN CASCADE - SVG Custom */}
      <WaterfallCascade data={data} color={color} />

      {/* Détails ligne par ligne */}
      <div className="space-y-2">
        <div className="flex justify-between items-center py-2.5 border-b border-slate-700/30">
          <span className="text-slate-300 text-sm">Base {formatPeriod(data.periodePrecedente)}</span>
          <span className="font-semibold text-white">{formatEuros(data.masseSalarialeM1)}</span>
        </div>
        
        <div className="flex justify-between items-center py-2.5 border-b border-slate-700/30">
          <span className="text-slate-300 text-sm">Effet Prix (augmentations)</span>
          <span className={`font-semibold ${
            data.effetPrix === 0 ? 'text-slate-400' : 
            data.effetPrix > 0 ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {formatEuros(data.effetPrix, true)}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2.5 border-b border-slate-700/30">
          <span className="text-slate-300 text-sm">Effet Volume (effectifs)</span>
          <span className={`font-semibold ${
            data.effetVolume === 0 ? 'text-slate-400' : 
            data.effetVolume > 0 ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {formatEuros(data.effetVolume, true)}
          </span>
        </div>
        
        <div className={`flex justify-between items-center py-3 ${colors.bg} rounded-lg px-4 mt-3`}>
          <span className="text-white font-semibold">Base {formatPeriod(data.periodeCourante)}</span>
          <span className={`font-bold text-xl ${colors.accent}`}>
            {formatEuros(data.masseSalarialeM)}
          </span>
        </div>
      </div>

      {/* Commentaires intelligents */}
      {comments.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-slate-300">Analyse</span>
          </div>
          <ul className="space-y-2">
            {comments.map((comment, idx) => (
              <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{comment}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/30">
        <div>
          <div className="text-xs text-slate-500 mb-1">Effectifs (ETP)</div>
          <div className="text-sm font-semibold text-white">
            {data.etpM1.toFixed(1)} → {data.etpM.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">Coût moyen/ETP</div>
          <div className="text-sm font-semibold text-white">
            {formatEuros(data.coutMoyenM1, false, true)} → {formatEuros(data.coutMoyenM, false, true)}
          </div>
        </div>
      </div>

    </div>
  )
}

// ============================================
// COMPOSANT WATERFALL CASCADE EN SVG
// ============================================
function WaterfallCascade({ 
  data, 
  color 
}: { 
  data: WaterfallData
  color: 'cyan' | 'purple' 
}) {
  const baseColor = color === 'cyan' ? '#22d3ee' : '#c084fc'
  // INVERSION: positif = rouge (coût), négatif = vert (économie), zéro = gris
  const positiveColor = '#ef4444' // Rouge pour augmentation de coût
  const negativeColor = '#10b981' // Vert pour diminution de coût
  const neutralColor = '#64748b'  // Gris pour zéro

  // Fonction pour obtenir la couleur selon la valeur
  const getEffectColor = (value: number) => {
    if (value === 0) return neutralColor
    return value > 0 ? positiveColor : negativeColor
  }

  // AMÉLIORATION: Calcul d'échelle dynamique pour mieux voir les effets
  const totalVariation = Math.abs(data.effetPrix) + Math.abs(data.effetVolume)
  const baseMin = Math.min(data.masseSalarialeM1, data.masseSalarialeM)
  
  // Échelle adaptative : on démarre à 80% de la base min pour voir les effets
  const min = baseMin * 0.8
  const max = Math.max(
    data.masseSalarialeM1,
    data.masseSalarialeM1 + data.effetPrix,
    data.masseSalarialeM1 + data.effetPrix + data.effetVolume,
    data.masseSalarialeM
  ) * 1.05 // +5% pour l'espace du label
  
  const range = max - min
  
  const HEIGHT = 260 // Augmenté de 220 à 260
  const TOP_MARGIN = 40 // Augmenté de 35 à 40
  const GAP = 45 // Augmenté de 40 à 45
  const BAR_WIDTH = 75 // Augmenté de 65 à 75

  // Fonction pour convertir une valeur en position Y
  const toY = (value: number) => TOP_MARGIN + (HEIGHT - ((value - min) / range * HEIGHT))

  // Positions des barres
  const base1Y = toY(data.masseSalarialeM1)
  const base1Height = (HEIGHT + TOP_MARGIN) - base1Y

  const afterPrix = data.masseSalarialeM1 + data.effetPrix
  const prixY = toY(afterPrix)
  const prixStartY = toY(data.masseSalarialeM1)
  const prixHeight = Math.abs(prixStartY - prixY)

  const afterVolume = afterPrix + data.effetVolume
  const volumeY = toY(afterVolume)
  const volumeStartY = toY(afterPrix)
  const volumeHeight = Math.abs(volumeStartY - volumeY)

  const baseMY = toY(data.masseSalarialeM)
  const baseMHeight = (HEIGHT + TOP_MARGIN) - baseMY

  const totalWidth = (BAR_WIDTH + GAP) * 3 + BAR_WIDTH

  return (
    <div className="bg-slate-950/30 rounded-lg p-6 border border-slate-700/20">
      <svg 
        viewBox={`0 0 ${totalWidth} ${HEIGHT + TOP_MARGIN + 45}`} 
        className="w-full h-80"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grille horizontale légère (SANS axe Y) */}
        {[0.25, 0.5, 0.75].map((ratio, i) => {
          const y = TOP_MARGIN + (ratio * HEIGHT)
          return (
            <line 
              key={i}
              x1={0} 
              y1={y} 
              x2={totalWidth} 
              y2={y} 
              stroke="#1e293b" 
              strokeWidth={0.5}
              strokeDasharray="4 2"
              opacity={0.3}
            />
          )
        })}

        {/* Barre 1: Base M-1 */}
        <g>
          <rect
            x={0}
            y={base1Y}
            width={BAR_WIDTH}
            height={base1Height}
            fill={baseColor}
            opacity={0.9}
            rx={4}
          />
          {/* Montant AU-DESSUS */}
          <text 
            x={BAR_WIDTH / 2} 
            y={base1Y - 12} 
            textAnchor="middle" 
            fill="#e2e8f0" 
            fontSize="14"
            fontWeight="700"
          >
            {formatEuros(data.masseSalarialeM1 / 1000, false, true)}k
          </text>
          {/* Label en bas */}
          <text 
            x={BAR_WIDTH / 2} 
            y={HEIGHT + TOP_MARGIN + 25} 
            textAnchor="middle" 
            fill="#94a3b8" 
            fontSize="12"
            fontWeight="600"
          >
            Base M-1
          </text>
        </g>

        {/* Connexion 1→2 */}
        <line
          x1={BAR_WIDTH}
          y1={prixStartY}
          x2={BAR_WIDTH + GAP}
          y2={prixStartY}
          stroke={getEffectColor(data.effetPrix)}
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.4}
        />

        {/* Barre 2: Effet Prix */}
        <g>
          <rect
            x={BAR_WIDTH + GAP}
            y={Math.min(prixY, prixStartY)}
            width={BAR_WIDTH}
            height={Math.max(prixHeight, 4)} // Min 4px pour visibilité
            fill={getEffectColor(data.effetPrix)}
            opacity={0.9}
            rx={4}
          />
          {/* Montant AU-DESSUS */}
          <text 
            x={BAR_WIDTH + GAP + BAR_WIDTH / 2} 
            y={Math.min(prixY, prixStartY) - 12} 
            textAnchor="middle" 
            fill={data.effetPrix === 0 ? '#94a3b8' : (data.effetPrix > 0 ? '#fca5a5' : '#6ee7b7')}
            fontSize="14"
            fontWeight="700"
          >
            {data.effetPrix === 0 ? '0' : formatEuros(data.effetPrix / 1000, true, true) + 'k'}
          </text>
          {/* Label en bas */}
          <text 
            x={BAR_WIDTH + GAP + BAR_WIDTH / 2} 
            y={HEIGHT + TOP_MARGIN + 25} 
            textAnchor="middle" 
            fill="#94a3b8" 
            fontSize="12"
            fontWeight="600"
          >
            Prix
          </text>
        </g>

        {/* Connexion 2→3 */}
        <line
          x1={BAR_WIDTH + GAP + BAR_WIDTH}
          y1={volumeStartY}
          x2={BAR_WIDTH + GAP + BAR_WIDTH + GAP}
          y2={volumeStartY}
          stroke={getEffectColor(data.effetVolume)}
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.4}
        />

        {/* Barre 3: Effet Volume */}
        <g>
          <rect
            x={(BAR_WIDTH + GAP) * 2}
            y={Math.min(volumeY, volumeStartY)}
            width={BAR_WIDTH}
            height={Math.max(volumeHeight, 4)} // Min 4px pour visibilité
            fill={getEffectColor(data.effetVolume)}
            opacity={0.9}
            rx={4}
          />
          {/* Montant AU-DESSUS */}
          <text 
            x={(BAR_WIDTH + GAP) * 2 + BAR_WIDTH / 2} 
            y={Math.min(volumeY, volumeStartY) - 12} 
            textAnchor="middle" 
            fill={data.effetVolume === 0 ? '#94a3b8' : (data.effetVolume > 0 ? '#fca5a5' : '#6ee7b7')}
            fontSize="14"
            fontWeight="700"
          >
            {data.effetVolume === 0 ? '0' : formatEuros(data.effetVolume / 1000, true, true) + 'k'}
          </text>
          {/* Label en bas */}
          <text 
            x={(BAR_WIDTH + GAP) * 2 + BAR_WIDTH / 2} 
            y={HEIGHT + TOP_MARGIN + 25} 
            textAnchor="middle" 
            fill="#94a3b8" 
            fontSize="12"
            fontWeight="600"
          >
            Volume
          </text>
        </g>

        {/* Connexion 3→4 */}
        <line
          x1={(BAR_WIDTH + GAP) * 2 + BAR_WIDTH}
          y1={baseMY}
          x2={(BAR_WIDTH + GAP) * 3}
          y2={baseMY}
          stroke={baseColor}
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.4}
        />

        {/* Barre 4: Base M */}
        <g>
          <rect
            x={(BAR_WIDTH + GAP) * 3}
            y={baseMY}
            width={BAR_WIDTH}
            height={baseMHeight}
            fill={baseColor}
            opacity={0.9}
            rx={4}
          />
          {/* Montant AU-DESSUS */}
          <text 
            x={(BAR_WIDTH + GAP) * 3 + BAR_WIDTH / 2} 
            y={baseMY - 12} 
            textAnchor="middle" 
            fill="#e2e8f0" 
            fontSize="14"
            fontWeight="700"
          >
            {formatEuros(data.masseSalarialeM / 1000, false, true)}k
          </text>
          {/* Label en bas */}
          <text 
            x={(BAR_WIDTH + GAP) * 3 + BAR_WIDTH / 2} 
            y={HEIGHT + TOP_MARGIN + 25} 
            textAnchor="middle" 
            fill="#94a3b8" 
            fontSize="12"
            fontWeight="600"
          >
            Base M
          </text>
        </g>

      </svg>
    </div>
  )
}

// ============================================
// GÉNÉRATION COMMENTAIRES INTELLIGENTS
// ============================================
function generateComments(data: WaterfallData): string[] {
  const comments: string[] = []

  // ============================================
  // PHASE 1: DÉTECTION DES RUBRIQUES EXCEPTIONNELLES
  // Logique : comparer M vs M-1 (ou N-1), seule la DIFFÉRENCE compte
  // ============================================
  const primesM = data.primesExceptionnellesM || 0
  const primesM1 = data.primesExceptionnellesM1 || 0
  const diffPrimes = primesM - primesM1
  
  // Ratio par rapport à la masse actuelle
  const primesRatioM = primesM / data.masseSalarialeM
  const primesRatioM1 = primesM1 / data.masseSalarialeM1
  
  // Détecter si 13ème mois UNIQUEMENT si présent dans M mais pas dans M-1
  // OU si différence significative (>20%)
  const is13eMoisNouveau = primesRatioM > 0.05 && primesRatioM1 < 0.05
  const diffPrimesSignificative = Math.abs(diffPrimes) > 10000 && Math.abs(diffPrimes) / Math.max(primesM1, 1) > 0.2
  
  let variationExpliqueeParPrimes = 0
  
  if (is13eMoisNouveau) {
    // Cas 1: 13ème mois versé cette période mais pas la précédente
    comments.push(
      `13ème mois versé : ${formatEuros(primesM)} (absent sur période précédente)`
    )
    variationExpliqueeParPrimes = primesM
  } else if (diffPrimesSignificative && primesRatioM > 0.05) {
    // Cas 2: 13ème mois présent dans les deux périodes MAIS différence significative
    if (diffPrimes > 0) {
      comments.push(
        `Prime 13ème mois en hausse : ${formatEuros(primesM)} vs ${formatEuros(primesM1)} (${formatEuros(diffPrimes, true)})`
      )
    } else {
      comments.push(
        `Prime 13ème mois en baisse : ${formatEuros(primesM)} vs ${formatEuros(primesM1)} (${formatEuros(diffPrimes, true)})`
      )
    }
    variationExpliqueeParPrimes = Math.abs(diffPrimes)
  } else if (primesRatioM > 0.05 && primesRatioM1 > 0.05 && Math.abs(diffPrimes) < 10000) {
    // Cas 3: 13ème mois présent dans les deux périodes, différence non significative
    // → NE PAS mentionner, c'est normal et récurrent
    variationExpliqueeParPrimes = 0
  }

  // ============================================
  // PHASE 2: ANALYSE DE L'EFFET PRIX
  // Exclure la part déjà expliquée par les primes
  // ============================================
  const effetPrixResiduel = Math.abs(data.effetPrix) - variationExpliqueeParPrimes
  
  if (variationExpliqueeParPrimes > 0 && effetPrixResiduel > 5000) {
    // Si primes exceptionnelles expliquent une partie, analyser le résiduel
    comments.push(
      `Effet Prix résiduel de ${formatEuros(effetPrixResiduel)} : ${
        data.effetPrix > 0 
          ? 'augmentations individuelles, promotions ou recrutements à salaires supérieurs'
          : 'diminutions salariales ou départs de profils coûteux'
      }`
    )
  } else if (Math.abs(data.effetPrix) > Math.abs(data.effetVolume) * 1.5 && Math.abs(data.effetPrix) > 5000) {
    // Effet Prix dominant (pas déjà expliqué par primes)
    if (data.effetPrix > 0) {
      comments.push(
        `Effet Prix dominant (+${formatEuros(Math.abs(data.effetPrix))}) : augmentations salariales significatives (revalorisations, promotions ou recrutements à salaires supérieurs)`
      )
    } else {
      comments.push(
        `Effet Prix négatif (${formatEuros(data.effetPrix)}) : diminutions salariales (départs de profils seniors, gel des augmentations ou renégociations)`
      )
    }
  }

  // ============================================
  // PHASE 3: ANALYSE DE L'EFFET VOLUME
  // ============================================
  const etpVariation = data.etpM - data.etpM1
  
  if (Math.abs(data.effetVolume) > Math.abs(data.effetPrix) * 1.5 && Math.abs(data.effetVolume) > 5000) {
    // Effet Volume dominant
    if (data.effetVolume > 0) {
      comments.push(
        `Effet Volume dominant (+${formatEuros(Math.abs(data.effetVolume))}) : embauches nettes de ${Math.abs(etpVariation).toFixed(1)} ETP`
      )
    } else {
      comments.push(
        `Effet Volume négatif (${formatEuros(data.effetVolume)}) : départs nets de ${Math.abs(etpVariation).toFixed(1)} ETP`
      )
    }
  } else if (Math.abs(etpVariation) > 0.5) {
    // Variation d'effectif notable mais pas dominante
    if (etpVariation > 0) {
      comments.push(
        `${etpVariation.toFixed(1)} ETP supplémentaires (embauches ou passages temps partiel → temps plein)`
      )
    } else {
      comments.push(
        `${Math.abs(etpVariation).toFixed(1)} ETP en moins (départs ou passages temps plein → temps partiel)`
      )
    }
  }

  // ============================================
  // PHASE 4: ANALYSE GLOBALE DE LA VARIATION
  // ============================================
  if (Math.abs(data.variationPct) > 30) {
    if (is13eMoisNouveau) {
      comments.push(
        `⚠️ Variation exceptionnelle de ${Math.abs(data.variationPct).toFixed(1)}% : largement expliquée par le versement du 13ème mois`
      )
    } else if (variationExpliqueeParPrimes > 0) {
      comments.push(
        `⚠️ Variation exceptionnelle de ${Math.abs(data.variationPct).toFixed(1)}% : partiellement expliquée par la hausse des primes, reste à analyser`
      )
    } else {
      comments.push(
        `⚠️ Variation exceptionnelle de ${Math.abs(data.variationPct).toFixed(1)}%, nécessite une analyse approfondie des causes`
      )
    }
  } else if (Math.abs(data.variationPct) < 3) {
    comments.push(
      `Masse salariale stable (${Math.abs(data.variationPct).toFixed(1)}% de variation), cohérent avec une activité régulière`
    )
  }

  // ============================================
  // PHASE 5: ANALYSE DU COÛT MOYEN
  // ============================================
  const coutMoyenVariation = ((data.coutMoyenM - data.coutMoyenM1) / data.coutMoyenM1) * 100
  
  if (Math.abs(coutMoyenVariation) > 5 && !is13eMoisNouveau) {
    // Ne mentionner que si pas déjà expliqué par un 13ème mois nouveau
    if (coutMoyenVariation > 0) {
      comments.push(
        `Coût moyen par ETP en hausse de ${coutMoyenVariation.toFixed(1)}% : ${
          etpVariation < 0 
            ? 'départs de profils juniors ou maintien des seniors'
            : 'recrutements de profils seniors ou augmentations générales'
        }`
      )
    } else {
      comments.push(
        `Coût moyen par ETP en baisse de ${Math.abs(coutMoyenVariation).toFixed(1)}% : ${
          etpVariation > 0
            ? 'recrutements de profils juniors'
            : 'départs de profils seniors'
        }`
      )
    }
  }

  // ============================================
  // PHASE 6: MIX PRIX/VOLUME ÉQUILIBRÉ
  // ============================================
  if (
    Math.abs(data.effetPrix) > 1000 && 
    Math.abs(data.effetVolume) > 1000 &&
    Math.abs(data.effetPrix / data.effetVolume) < 2 &&
    Math.abs(data.effetVolume / data.effetPrix) < 2 &&
    !is13eMoisNouveau
  ) {
    comments.push(
      `Variation équilibrée entre Effet Prix (${formatEuros(data.effetPrix, true)}) et Effet Volume (${formatEuros(data.effetVolume, true)})`
    )
  }

  return comments
}

// ============================================
// UTILITAIRES
// ============================================
function formatEuros(value: number, showSign = false, short = false): string {
  const absValue = Math.abs(value)
  
  if (short && absValue >= 1000) {
    const formatted = `${(absValue / 1000).toFixed(0)}k €`
    return showSign && value !== 0 
      ? (value >= 0 ? `+${formatted}` : `-${formatted}`)
      : formatted
  }

  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(absValue)
  
  if (showSign && value !== 0) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`
  }
  return formatted
}

function formatPeriod(period: string): string {
  const date = new Date(period)
  return new Intl.DateTimeFormat('fr-FR', { 
    month: 'short', 
    year: 'numeric' 
  }).format(date)
}