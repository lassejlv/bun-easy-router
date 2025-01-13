type Next = () => Promise<Response> | Response

interface AuthOptions {
  /**
   * Custom function to validate the token
   */
  validate?: (token: string) => Promise<boolean> | boolean

  /**
   * List of paths to exclude from authentication
   * Supports string comparison and regex patterns
   */
  exclude?: (string | RegExp)[]

  /**
   * Custom error response when authentication fails
   */
  onError?: (error: Error) => Response | Promise<Response>

  /**
   * Custom header name for the authorization token
   * @default 'Authorization'
   */
  header?: string

  /**
   * Custom scheme for the authorization header
   * @default 'Bearer'
   */
  scheme?: string
}

const defaultOptions: Required<AuthOptions> = {
  validate: async () => true,
  exclude: [],
  onError: (error) => new Response('Unauthorized', { status: 401 }),
  header: 'Authorization',
  scheme: 'Bearer',
}

function isPathExcluded(path: string, excludeList: (string | RegExp)[]): boolean {
  return excludeList.some((pattern) => {
    if (pattern instanceof RegExp) {
      return pattern.test(path)
    }
    return path === pattern
  })
}

function extractToken(header: string | null, scheme: string): string | null {
  if (!header) return null

  const [authScheme, token] = header.split(' ')
  if (authScheme !== scheme || !token) return null

  return token
}

export function BearerAuth(options: AuthOptions = {}) {
  const resolvedOptions: Required<AuthOptions> = {
    ...defaultOptions,
    ...options,
  }

  return async (request: Request, next: Next): Promise<Response> => {
    const url = new URL(request.url)

    // Check if path is excluded
    if (isPathExcluded(url.pathname, resolvedOptions.exclude)) {
      return next()
    }

    try {
      // Extract token from header
      const authHeader = request.headers.get(resolvedOptions.header)
      const token = extractToken(authHeader, resolvedOptions.scheme)

      if (!token) {
        throw new Error('No token provided')
      }

      // Validate token
      const isValid = await resolvedOptions.validate(token)

      if (!isValid) {
        throw new Error('Invalid token')
      }

      // If validation passes, continue to next middleware/route
      return next()
    } catch (error) {
      if (error instanceof Error) {
        return resolvedOptions.onError(error)
      }
      return new Response('Unauthorized', { status: 401 })
    }
  }
}
