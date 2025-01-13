import chalk from 'chalk'

type Next = () => Promise<Response> | Response

interface LoggerOptions {
  enabled?: boolean
  showTimestamp?: boolean
  showDuration?: boolean
}

function formatStatusCode(status: number): string {
  if (status >= 500) {
    return chalk.red(status)
  } else if (status >= 400) {
    return chalk.yellow(status)
  } else if (status >= 300) {
    return chalk.cyan(status)
  } else if (status >= 200) {
    return chalk.green(status)
  }
  return chalk.gray(status)
}

function formatMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return chalk.blue(method)
    case 'POST':
      return chalk.green(method)
    case 'PUT':
      return chalk.yellow(method)
    case 'DELETE':
      return chalk.red(method)
    case 'PATCH':
      return chalk.magenta(method)
    default:
      return chalk.gray(method)
  }
}

function formatTimestamp(): string {
  const now = new Date()
  return chalk.gray(`[${now.toLocaleDateString()} ${now.toLocaleTimeString()}]`)
}

function formatDuration(duration: number): string {
  if (duration > 1000) {
    return chalk.red(`${(duration / 1000).toFixed(2)}s`)
  } else if (duration > 100) {
    return chalk.yellow(`${duration.toFixed(2)}ms`)
  }
  return chalk.green(`${duration.toFixed(2)}ms`)
}

function formatPath(path: string): string {
  return chalk.white(path)
}

export function Logger(options: LoggerOptions = {}) {
  const { enabled = true, showTimestamp = true, showDuration = true } = options

  return async (request: Request, next: Next): Promise<Response> => {
    if (!enabled) return next()

    const url = new URL(request.url)
    const startTime = performance.now()

    // Log request
    const requestLog = [showTimestamp ? formatTimestamp() : null, '→', formatMethod(request.method), formatPath(url.pathname)].filter(Boolean).join(' ')

    console.log(requestLog)

    try {
      // Execute route handler
      const response = await next()
      const duration = performance.now() - startTime

      // Log response
      const responseLog = [
        showTimestamp ? formatTimestamp() : null,
        '←',
        formatMethod(request.method),
        formatPath(url.pathname),
        formatStatusCode(response.status),
        showDuration ? formatDuration(duration) : null,
      ]
        .filter(Boolean)
        .join(' ')

      console.log(responseLog)

      return response
    } catch (error) {
      const duration = performance.now() - startTime

      // Log error
      const errorLog = [
        showTimestamp ? formatTimestamp() : null,
        '⨯',
        formatMethod(request.method),
        formatPath(url.pathname),
        chalk.red('ERROR'),
        showDuration ? formatDuration(duration) : null,
      ]
        .filter(Boolean)
        .join(' ')

      console.error(errorLog)
      console.error(chalk.red(error))

      throw error
    }
  }
}
