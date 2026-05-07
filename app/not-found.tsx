import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: '404 — GDAI Agentic Cockpit' }

export default function NotFound() {
  return (
    <main id="main-content">
      <h1>Page not found</h1>
      <p className="empty-state">The page you requested does not exist.</p>
      <Link href="/">Return to dashboard</Link>
    </main>
  )
}
