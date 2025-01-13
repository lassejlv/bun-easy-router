import { Context, Route } from './context'

// Type utilities for extracting parameter names from path patterns
type ExtractRouteParams<T extends string> = string extends T
  ? RouteParams
  : T extends `${infer Start}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
  : T extends `${infer Start}:${infer Param}`
  ? { [K in Param]: string }
  : {}

interface RouteParams {
  [key: string]: string
}

type Next = () => Promise<Response> | Response

type Middleware = (request: Request, next: Next) => Promise<Response> | Response

// Updated handler type to use Route interface
type RouteHandler<T extends string> = (c: Omit<Route, 'params'> & { params: ExtractRouteParams<T> }) => Response | Promise<Response>

interface RouteDefinition {
  pattern: RegExp
  paramNames: string[]
  handler: (context: Route) => Response | Promise<Response>
}

class Router {
  private routes: Map<string, RouteDefinition[]> = new Map()
  private middlewares: Middleware[] = []

  constructor(private request: Request) {
    this.routes.set('GET', [])
    this.routes.set('POST', [])
    this.routes.set('PUT', [])
    this.routes.set('DELETE', [])
  }

  private parsePathPattern(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = []

    const regexPattern = path.replace(/:([a-zA-Z][a-zA-Z0-9]*)/g, (_, paramName) => {
      paramNames.push(paramName)
      return '([^/]+)'
    })

    return {
      pattern: new RegExp(`^${regexPattern}$`),
      paramNames,
    }
  }

  private addRoute<T extends string>(method: string, path: T, handler: RouteHandler<T>) {
    const methodRoutes = this.routes.get(method)
    if (methodRoutes) {
      const { pattern, paramNames } = this.parsePathPattern(path)
      methodRoutes.push({
        pattern,
        paramNames,
        handler: (context: Route) => handler(context as Route & { params: ExtractRouteParams<T> }),
      })
    }
  }

  private findRoute(method: string, path: string): { route: RouteDefinition; params: RouteParams } | null {
    const methodRoutes = this.routes.get(method)
    if (!methodRoutes) return null

    for (const route of methodRoutes) {
      const match = path.match(route.pattern)
      if (match) {
        const params: RouteParams = {}
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1]
        })
        return { route, params }
      }
    }

    return null
  }

  // Add middleware
  use(middleware: Middleware) {
    this.middlewares.push(middleware)
    return this
  }

  // Execute middleware chain
  private async executeMiddlewareChain(index: number, request: Request, finalHandler: () => Promise<Response> | Response): Promise<Response> {
    if (index >= this.middlewares.length) {
      return finalHandler()
    }

    const middleware = this.middlewares[index]
    return middleware(request, () => this.executeMiddlewareChain(index + 1, request, finalHandler))
  }

  get<T extends string>(path: T, handler: RouteHandler<T>) {
    this.addRoute('GET', path, handler)
    return this
  }

  post<T extends string>(path: T, handler: RouteHandler<T>) {
    this.addRoute('POST', path, handler)
    return this
  }

  put<T extends string>(path: T, handler: RouteHandler<T>) {
    this.addRoute('PUT', path, handler)
    return this
  }

  delete<T extends string>(path: T, handler: RouteHandler<T>) {
    this.addRoute('DELETE', path, handler)
    return this
  }

  async run(): Promise<Response> {
    const method = this.request.method
    const url = new URL(this.request.url)
    const path = url.pathname

    const routeMatch = this.findRoute(method, path)
    if (!routeMatch) {
      return new Response('Not Found', { status: 404 })
    }

    try {
      // Create context with params
      const ctx = Context(this.request)
      const routeContext: Route = {
        ...ctx,
        params: routeMatch.params,
      }

      // Execute middleware chain before running the route handler
      return await this.executeMiddlewareChain(0, this.request, () => routeMatch.route.handler(routeContext))
    } catch (error) {
      console.error('Router error:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}

// Factory function to create new router instances
function createRouter(request: Request) {
  return new Router(request)
}

export default createRouter
