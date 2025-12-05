import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/styles/export.css'  // ← AJOUTER CETTE LIGNE

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Talvio - Vos données RH, enfin lisibles',
  description: 'Transformez vos données RH en décisions stratégiques',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}