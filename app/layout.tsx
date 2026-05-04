import type { Metadata } from 'next'

import '@xyflow/react/dist/style.css'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'agentic_railway',
  description: 'Railway-inspired agentic control plane with external Supabase configuration.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
