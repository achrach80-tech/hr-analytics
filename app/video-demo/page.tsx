'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Play, Pause, Volume2, VolumeX, 
  Maximize, Download, Share2, CheckCircle2,
  Clock, Users, TrendingUp, Sparkles, Brain
} from 'lucide-react'

export default function VideoDemoPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleMuteUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = parseFloat(e.target.value)
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const demoHighlights = [
    {
      icon: Clock,
      time: '0:15',
      title: 'Import Excel en 2 minutes',
      description: 'Glissez-déposez votre fichier RH'
    },
    {
      icon: TrendingUp,
      time: '0:45',
      title: 'Dashboard instantané',
      description: '15+ KPIs calculés automatiquement'
    },
    {
      icon: Users,
      time: '1:30',
      title: 'Analyses avancées',
      description: 'Turnover, masse salariale, pyramides'
    },
    {
      icon: Sparkles,
      time: '2:15',
      title: 'Vision Builder',
      description: 'Créez vos rapports personnalisés'
    }
  ]

  const benefits = [
    'Installation en 10 minutes',
    'Aucune formation requise',
    'Support technique inclus',
    'Conforme RGPD'
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Enhanced Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.15),transparent_50%)]" />
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
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
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-5 py-2.5 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft size={18} />
                <span>Retour</span>
              </button>
              <button
                onClick={() => router.push('/demo')}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-105"
              >
                Essayer gratuitement
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Video Player - 2/3 width */}
          <div className="lg:col-span-2">
            {/* Title */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-full mb-4">
                <Play className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">Démo complète • 3 minutes</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Découvrez Talvio
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  en action
                </span>
              </h1>
              <p className="text-lg text-gray-400">
                Voyez comment transformer vos données RH en dashboards professionnels en quelques clics
              </p>
            </div>

            {/* Video Container */}
            <div 
              className="relative group"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(isPlaying ? false : true)}
            >
              <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Video */}
                <video
                  ref={videoRef}
                  className="w-full aspect-video object-cover"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  onClick={handlePlayPause}
                >
                  <source src="/videos/talvio-demo.mp4" type="video/mp4" />
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>

                {/* Play Overlay */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <button
                      onClick={handlePlayPause}
                      className="w-20 h-20 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shadow-purple-500/50"
                    >
                      <Play size={32} className="text-white ml-1" />
                    </button>
                  </div>
                )}

                {/* Custom Controls */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 transition-opacity duration-300 ${
                    showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handlePlayPause}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                      </button>
                      <button
                        onClick={handleMuteUnmute}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                      >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {/* Share functionality */}}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Share2 size={18} />
                      </button>
                      <button
                        onClick={handleFullscreen}
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Maximize size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-3xl blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Video Timeline Highlights */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {demoHighlights.map((highlight, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (videoRef.current) {
                      const [minutes, seconds] = highlight.time.split(':').map(Number)
                      videoRef.current.currentTime = minutes * 60 + seconds
                      if (!isPlaying) {
                        videoRef.current.play()
                        setIsPlaying(true)
                      }
                    }
                  }}
                  className="group p-4 bg-white/5 hover:bg-white/10 backdrop-blur rounded-xl border border-white/10 hover:border-purple-500/30 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <highlight.icon className="text-purple-400" size={16} />
                    </div>
                    <span className="text-xs text-purple-400 font-semibold">{highlight.time}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{highlight.title}</h4>
                  <p className="text-xs text-gray-400">{highlight.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="lg:col-span-1 space-y-6">
            {/* CTA Card */}
            <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-8 sticky top-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="text-white" size={24} />
              </div>
              
              <h3 className="text-2xl font-bold mb-4">
                Prêt à essayer Talvio ?
              </h3>
              
              <p className="text-gray-400 mb-6">
                Créez votre compte et importez votre premier fichier Excel en moins de 10 minutes
              </p>

              <button
                onClick={() => router.push('/demo')}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:scale-105 mb-6"
              >
                Commencer gratuitement
              </button>

              {/* Benefits List */}
              <div className="space-y-3 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
                    <span className="text-sm text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Resources Section - Inside CTA Card */}
              <div className="pt-6 border-t border-white/10">
                <h4 className="text-lg font-semibold mb-4">Ressources utiles</h4>
                
                <div className="space-y-3">
                  <a 
                    href="#"
                    className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-purple-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="text-purple-400 group-hover:scale-110 transition-transform" size={20} />
                      <div>
                        <p className="text-sm font-medium text-white">Guide de démarrage</p>
                        <p className="text-xs text-gray-400">PDF • 2 Mo</p>
                      </div>
                    </div>
                  </a>

                  <a 
                    href="#"
                    className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-purple-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="text-cyan-400 group-hover:scale-110 transition-transform" size={20} />
                      <div>
                        <p className="text-sm font-medium text-white">Template Excel</p>
                        <p className="text-xs text-gray-400">XLSX • 45 Ko</p>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <section className="relative py-20 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Des questions ?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Notre équipe est là pour vous accompagner dans la mise en place de Talvio
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/demo')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all hover:scale-105"
            >
              Demander une démo personnalisée
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all"
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}