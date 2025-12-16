'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, Brain, Shield, TrendingUp, 
  Sparkles, Building2, Euro, Check, Play,
  Activity, Clock, Target, Gauge, Database, Lock, Globe, 
  Zap, Users, BarChart3, Calendar, FileSpreadsheet
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [activeMetric, setActiveMetric] = useState(0)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMetric((prev) => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const animatedMetrics = [
    { label: 'Taux de Turnover', value: '8.2%', trend: -2.3, color: '#10b981' },
    { label: 'Absentéisme', value: '4.7%', trend: -1.2, color: '#06b6d4' },
    { label: 'Effectifs', value: '1,247', trend: 3.5, color: '#8b5cf6' },
    { label: 'Masse Salariale', value: '4.2M €', trend: 2.1, color: '#f59e0b' }
  ]

  const targetClients = [
    { icon: Building2, title: '50-1500 salariés', desc: 'PME & ETI' },
    { icon: Users, title: 'DRH autonomes', desc: 'Sans équipe tech' },
    { icon: TrendingUp, title: 'Croissance rapide', desc: 'Besoins évolutifs' },
    { icon: Globe, title: 'Multi-sites', desc: 'Plusieurs établissements' }
  ]

  const benefits = [
    {
      icon: Zap,
      title: "2 minutes pour vos KPIs",
      description: "Uploadez votre Excel RH, obtenez instantanément turnover, masse salariale et effectifs. Sans formation."
    },
    {
      icon: Target,
      title: "Tous vos indicateurs en un coup d'œil",
      description: "Pyramides, évolutions, analyses financières : tout votre reporting RH sur un seul tableau de bord."
    },
    {
      icon: FileSpreadsheet,
      title: "Vos fichiers Excel suffisent",
      description: "Pas besoin de changer vos process. Talvio s'adapte à vos exports de paie et effectifs actuels."
    },
    {
      icon: Shield,
      title: "Sécurité niveau banque",
      description: "Données hébergées en France, conformes RGPD, chiffrées AES-256. Vos données RH restent privées."
    }
  ]

  const features = [
    {
      category: "Indicateurs RH",
      icon: Gauge,
      color: "purple",
      items: [
        "Effectifs et mouvements (entrées/sorties)",
        "Turnover & taux de rotation",
        "Absentéisme et jours d'absence",
        "Pyramides des âges et anciennetés",
        "Répartition par genre et contrats"
      ]
    },
    {
      category: "Analyses Financières",
      icon: Euro,
      color: "cyan",
      items: [
        "Masse salariale totale et évolutions",
        "Effets Prix / Volume / Mix",
        "Coût moyen par ETP",
        "Comparaisons vs mois/année précédente",
        "Projections et tendances"
      ]
    },
    {
      category: "Vision Builder",
      icon: Sparkles,
      color: "green",
      items: [
        "Créez vos propres rapports personnalisés",
        "Drag & drop de composants",
        "Export PDF et PNG haute qualité",
        "Rapports mensuels automatisés",
        "Templates réutilisables"
      ]
    }
  ]

  const stats = [
    { value: "2 min", label: "Temps d'import", icon: Clock },
    { value: "15+", label: "KPIs disponibles", icon: BarChart3 },
    { value: "24 mois", label: "Historique analysé", icon: Calendar },
    { value: "100%", label: "Conforme RGPD", icon: Shield }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Enhanced Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.1),transparent_50%)]" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 backdrop-blur-xl bg-black/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Brain size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  TALVIO
                </h1>
                <p className="text-xs text-gray-500">Vos données RH, enfin lisibles</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/login')}
                className="px-5 py-2.5 text-gray-300 hover:text-white transition-colors"
              >
                Espace Client
              </button>
              <button
                onClick={() => router.push('/demo')}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-105"
              >
                Demander une Démo
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div>
              {/* Badge - Version pré-clients */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-full mb-8">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="text-sm text-gray-300">Nouveau • Conçu pour les PME et ETI françaises</span>
              </div>
              
              <h1 className="text-6xl font-bold leading-tight mb-6">
                <span className="bg-gradient-to-br from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Vos données RH
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  enfin lisibles
                </span>
              </h1>
              
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Uploadez votre Excel RH, obtenez vos KPIs en 2 minutes. 
                <span className="text-white font-semibold"> Effectifs, turnover, masse salariale</span> : 
                visualisez tout instantanément, sans formation technique.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => router.push('/demo')}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:scale-105 flex items-center justify-center gap-3"
                >
                  Tester gratuitement
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
                  className="px-8 py-4 bg-white/5 backdrop-blur border border-white/10 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                >
                  <Play size={20} />
                  Voir la démo (2 min)
                </button>
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Shield className="text-green-500" size={20} />
                  <span className="text-sm text-gray-400">Conforme RGPD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="text-green-500" size={20} />
                  <span className="text-sm text-gray-400">Hébergé en France</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="text-green-500" size={20} />
                  <span className="text-sm text-gray-400">Chiffrement AES-256</span>
                </div>
              </div>
            </div>

            {/* Right: Animated Dashboard Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-3xl" />
              
              <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Dashboard RH</h3>
                    <p className="text-sm text-gray-400">Temps réel • Janvier 2025</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {animatedMetrics.map((metric, index) => (
                    <div
                      key={metric.label}
                      className={`p-4 rounded-xl transition-all duration-500 ${
                        activeMetric === index 
                          ? 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 scale-105' 
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <p className="text-xs text-gray-400 mb-2">{metric.label}</p>
                      <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} style={{ color: metric.color }} />
                        <span className="text-xs" style={{ color: metric.color }}>
                          {metric.trend > 0 ? '+' : ''}{metric.trend}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-400">Évolution Effectifs</span>
                    <Activity className="text-green-500 animate-pulse" size={16} />
                  </div>
                  <div className="h-32 flex items-end gap-2">
                    {[40, 55, 45, 70, 65, 80, 75, 90, 85, 95].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-purple-500 to-cyan-500 rounded-t opacity-80"
                        style={{
                          height: `${height}%`,
                          animation: `grow 0.5s ease-out ${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2 animate-bounce">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Temps réel
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Clients - Remplace "20+ entreprises" */}
      <section className="py-16 border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-gray-400 mb-12 text-lg">
            <span className="text-purple-400 font-semibold">Conçu pour les PME et ETI françaises</span> qui veulent piloter leurs RH sans consultant
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {targetClients.map((client) => (
              <div key={client.title} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <client.icon className="text-purple-400" size={28} />
                </div>
                <div className="text-lg font-bold text-white mb-1">{client.title}</div>
                <div className="text-sm text-gray-400">{client.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Pourquoi choisir Talvio ?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Pas de formation, pas de consultant. Juste vos fichiers Excel et des insights RH clairs en 2 minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group p-8 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <benefit.icon className="text-purple-400" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-gray-400 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <stat.icon className="text-purple-400" size={32} />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Un tableau de bord complet pour piloter vos RH au quotidien
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div 
                key={feature.category}
                className={`bg-gradient-to-br from-${feature.color}-500/10 to-transparent backdrop-blur rounded-2xl border border-${feature.color}-500/20 p-8`}
              >
                <feature.icon className={`text-${feature.color}-400 mb-4`} size={32} />
                <h3 className="text-2xl font-semibold mb-6">{feature.category}</h3>
                <ul className="space-y-3">
                  {feature.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-300">
                      <Check className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent to-purple-900/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">Récupérez 5 heures par mois</h2>
          <p className="text-xl text-gray-400 mb-12">
            Automatisez vos tableaux de bord RH et concentrez-vous sur l&apos;essentiel : vos équipes
          </p>
          
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur rounded-3xl border border-white/10 p-12">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">5h</div>
                <p className="text-gray-400">économisées chaque mois</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-cyan-400 mb-2">1 clic</div>
                <p className="text-gray-400">pour tous vos dashboards</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">15+</div>
                <p className="text-gray-400">KPIs prêts à l&apos;emploi</p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/demo')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:scale-105"
            >
              Commencer gratuitement →
            </button>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Prêt à transformer vos données RH ?
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Créez votre compte gratuit et importez votre premier fichier en moins de 10 minutes
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <button
              onClick={() => router.push('/demo')}
              className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl font-semibold text-xl hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              Essayer gratuitement
              <Sparkles className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="text-green-500" size={16} />
              <span>Essai gratuit 14 jours</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="text-green-500" size={16} />
              <span>Sans carte bancaire</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="text-green-500" size={16} />
              <span>Installation en 10 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Brain size={24} className="text-white" />
              </div>
              <span className="text-lg font-semibold">Talvio</span>
            </div>
            
            <div className="flex gap-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-white transition-colors">RGPD</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="/login" className="hover:text-white transition-colors">Espace Client</a>
            </div>
            
            <p className="text-sm text-gray-500">
              © 2025 TALVIO. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes grow {
          from {
            height: 0;
          }
        }
      `}</style>
    </div>
  )
}