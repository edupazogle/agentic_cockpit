import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  typedRoutes: true,
  async rewrites() {
    return [
      // Synthetic demo DB routes — n8n MCP workflows call /demo/* directly
      { source: '/demo/:path*', destination: '/api/demo/:path*' },
    ]
  },
}

export default nextConfig
