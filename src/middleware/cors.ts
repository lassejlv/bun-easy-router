type Next = () => Promise<Response> | Response

interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean)
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  preflight?: boolean
}

const defaultOptions: Required<CorsOptions> = {
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: [],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400, // 24 hours
  preflight: true,
}

function isOriginAllowed(origin: string, allowedOrigin: string | string[] | ((origin: string) => boolean)): boolean {
  if (typeof allowedOrigin === 'string') {
    return allowedOrigin === '*' || origin === allowedOrigin
  }
  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin)
  }
  if (typeof allowedOrigin === 'function') {
    return allowedOrigin(origin)
  }
  return false
}

export function Cors(options: CorsOptions = {}) {
  // Merge options with defaults at middleware creation time
  const resolvedOptions: Required<CorsOptions> = {
    ...defaultOptions,
    ...options,
  }

  return async (request: Request, next: Next): Promise<Response> => {
    const requestOrigin = request.headers.get('origin') || ''
    const responseHeaders = new Headers()

    // Handle origin
    if (isOriginAllowed(requestOrigin, resolvedOptions.origin)) {
      responseHeaders.set(
        'Access-Control-Allow-Origin',
        resolvedOptions.origin === '*' && resolvedOptions.credentials
          ? requestOrigin
          : typeof resolvedOptions.origin === 'string'
          ? resolvedOptions.origin
          : requestOrigin
      )
    }

    // Handle credentials
    if (resolvedOptions.credentials) {
      responseHeaders.set('Access-Control-Allow-Credentials', 'true')
    }

    // Handle OPTIONS preflight request
    if (resolvedOptions.preflight && request.method === 'OPTIONS') {
      // Add allowed methods
      responseHeaders.set('Access-Control-Allow-Methods', resolvedOptions.methods.join(', '))

      // Add allowed headers
      if (resolvedOptions.allowedHeaders.length) {
        responseHeaders.set('Access-Control-Allow-Headers', resolvedOptions.allowedHeaders.join(', '))
      } else {
        const requestHeaders = request.headers.get('access-control-request-headers')
        if (requestHeaders) {
          responseHeaders.set('Access-Control-Allow-Headers', requestHeaders)
        }
      }

      // Add exposed headers
      if (resolvedOptions.exposedHeaders.length) {
        responseHeaders.set('Access-Control-Expose-Headers', resolvedOptions.exposedHeaders.join(', '))
      }

      // Add max age
      if (resolvedOptions.maxAge) {
        responseHeaders.set('Access-Control-Max-Age', resolvedOptions.maxAge.toString())
      }

      // Return preflight response
      return new Response(null, {
        status: 204,
        headers: responseHeaders,
      })
    }

    // Handle actual request
    const response = await next()
    const newResponse = new Response(response.body, response)

    // Add CORS headers to response
    responseHeaders.forEach((value, key) => {
      newResponse.headers.set(key, value)
    })

    return newResponse
  }
}
