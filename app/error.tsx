'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main id="main-content">
      <h1>Something went wrong</h1>
      <p className="empty-state">
        {error.digest ? `Error ${error.digest}` : 'An unexpected error occurred.'}
      </p>
      <button onClick={reset} type="button">
        Try again
      </button>
    </main>
  )
}
