import { getRun } from '@/lib/server/runtime/run-store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params
  const run = await getRun(runId)

  if (!run) {
    return new Response('Run not found', { status: 404 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      let lastSnapshotHash = JSON.stringify(run)

      const pushSnapshot = async () => {
        const snapshot = await getRun(runId)
        if (!snapshot || closed) {
          return
        }
        const nextHash = JSON.stringify(snapshot)
        if (nextHash === lastSnapshotHash) {
          return
        }
        lastSnapshotHash = nextHash
        controller.enqueue(
          encoder.encode(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`),
        )
      }

      controller.enqueue(
        encoder.encode(`event: snapshot\ndata: ${JSON.stringify(run)}\n\n`),
      )

      const keepAlive = setInterval(() => {
        if (!closed) {
          controller.enqueue(encoder.encode(': ping\n\n'))
        }
      }, 15000)

      const poll = setInterval(() => {
        void pushSnapshot()
      }, 1000)

      const cleanup = () => {
        if (closed) {
          return
        }
        closed = true
        clearInterval(keepAlive)
        clearInterval(poll)
        controller.close()
      }

      request.signal.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}
