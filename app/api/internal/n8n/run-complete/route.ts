import { handleSignedN8nCallback } from '@/lib/server/runtime/callback-routes'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleSignedN8nCallback(request, 'completed')
}
