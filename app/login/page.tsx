import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login — GDAI Agentic Cockpit',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  return (
    <div className="login-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <main id="main-content" className="login-card" role="main">
        <div className="login-brand">
          <span className="login-brand__wordmark">GDAI</span>
          <span className="login-brand__subtitle">Agentic Cockpit</span>
        </div>
        <h1 className="login-heading">Sign in</h1>
        {/* LoginForm is a client component that calls the gateway auth endpoint */}
        <LoginFormPlaceholder />
      </main>
    </div>
  )
}

/**
 * Placeholder — will be replaced by the real <LoginForm> client component
 * once the gateway auth endpoint is deployed to staging.
 */
function LoginFormPlaceholder() {
  return (
    <p className="login-placeholder" aria-label="Login form loading">
      Connecting to authentication service…
    </p>
  )
}
