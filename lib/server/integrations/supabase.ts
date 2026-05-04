interface SupabaseEnv {
  url: string
  key: string
}

interface FetchErrorWithCode {
  code?: string
  cause?: unknown
}

export class SupabaseHttpError extends Error {
  status: number
  detail: string

  constructor(message: string, status: number, detail: string) {
    super(message)
    this.name = 'SupabaseHttpError'
    this.status = status
    this.detail = detail
  }
}

export class SupabaseConnectivityError extends Error {
  code?: string
  url: string

  constructor(message: string, url: string, code?: string) {
    super(message)
    this.name = 'SupabaseConnectivityError'
    this.code = code
    this.url = url
  }
}

function readSupabaseEnv(): SupabaseEnv | null {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/$/, '')
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim()

  if (!url || !key) {
    return null
  }

  return { url, key }
}

export function hasSupabaseConfig() {
  return Boolean(readSupabaseEnv())
}

type SupabaseResponseType = 'json' | 'text' | 'arrayBuffer' | 'void'

interface SupabaseRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'HEAD'
  path: string
  query?: Record<string, string>
  headers?: Record<string, string>
  body?: BodyInit | null
  responseType?: SupabaseResponseType
}

export function getSupabaseEnv() {
  const env = readSupabaseEnv()

  if (!env) {
    throw new Error(
      'Supabase environment is missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.',
    )
  }

  return env
}

export async function supabaseRequest<T = unknown>({
  method = 'GET',
  path,
  query,
  headers,
  body,
  responseType = 'json',
}: SupabaseRequestOptions): Promise<T> {
  const env = getSupabaseEnv()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${env.url}${normalizedPath}`)

  Object.entries(query ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  let response: Response

  try {
    response = await fetch(url, {
      method,
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${env.key}`,
        ...(responseType === 'json' ? { Accept: 'application/json' } : {}),
        ...(headers ?? {}),
      },
      body,
      cache: 'no-store',
    })
  } catch (error) {
    const fetchError = error as FetchErrorWithCode
    const cause = fetchError.cause as FetchErrorWithCode | undefined
    const code = fetchError.code || cause?.code
    const reason = code ? ` (${code})` : ''

    throw new SupabaseConnectivityError(
      `Supabase connectivity failed for ${url.toString()}${reason}. Verify SUPABASE_URL and DNS/network access.`,
      url.toString(),
      code,
    )
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new SupabaseHttpError(
      `Supabase request failed for ${normalizedPath}: HTTP ${response.status}`,
      response.status,
      detail,
    )
  }

  if (responseType === 'void' || method === 'HEAD') {
    return undefined as T
  }

  if (responseType === 'text') {
    return (await response.text()) as T
  }

  if (responseType === 'arrayBuffer') {
    return (await response.arrayBuffer()) as T
  }

  return response.json() as Promise<T>
}

export async function supabaseSelect<T>(table: string, query: Record<string, string>): Promise<T> {
  return supabaseRequest<T>({
    method: 'GET',
    path: `/rest/v1/${table}`,
    query,
  })
}
