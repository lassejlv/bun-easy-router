# Bun Easy Router (works with Deno/Node too)

A lightweight, type-safe router for Bun with middleware support and context utilities.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Features](#features)
- [Router](#router)
  - [Context Utilities](#context-utilities)
  - [Route Parameters](#route-parameters)
  - [HTTP Methods](#http-methods)
  - [Type Safety](#type-safety)
- [Middleware](#middleware)
  - [Logger Middleware](#logger-middleware)
  - [CORS Middleware](#cors-middleware)
  - [Bearer Auth Middleware](#bearer-auth-middleware)
  - [Serve Static Files](#serve-static-files)

## Installation

```bash
bun add bun-easy-router # or deno add npm:bun-easy-router or npm add bun-easy-router
```

## Basic Usage

```typescript
import { Router, Logger, Cors, BearerAuth } from 'bun-easy-router'

// Deno.serve is also supported the same way.
Bun.serve({
  port: 3001,
  fetch: async (request: Request) => {
    const router = Router(request)

    // Add middleware
    router.use(Logger())
    router.use(Cors())
    router.use(BearerAuth())

    // Define routes with context
    router.get('/', (c) => {
      return c.json({ message: 'Hello, world!' })
    })

    router.get('/users/:id', (c) => {
      const userId = c.params.id
      return c.json({ userId })
    })

    return router.run()
  },
})
```

### Using with node.js

```javascript
import { Logger, Router } from 'bun-easy-router'
import { createServer } from 'http'

const server = createServer(async (req, res) => {
  const webRequest = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: req.headers,
  })

  const router = new Router(webRequest)
  router.use(Logger())
  router.get('/', (c) => c.json('Hello world!'))

  try {
    const response = await router.run()
    // Convert Web Response back to Node response
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(await response.text())
  } catch (error) {
    res.writeHead(500)
    res.end('Internal Server Error')
  }
})

server.listen(3000)
```

## Features

- 🚀 Fast and lightweight
- 💪 Full TypeScript support
- 🎯 Type-safe route parameters
- 🔌 Middleware support
- 📝 Built-in logging
- 🔒 CORS and Authentication
- ⚡ Async/await support
- 🎉 Context utilities
- 📦 File handling

## Router

### Context Utilities

The router provides a rich context object with helpful utilities:

```typescript
// JSON responses
router.get('/api/data', (c) => {
  return c.json({ data: 'value' })
})

// Pretty JSON for debugging
router.get('/api/debug', (c) => {
  return c.pretty({
    nested: { data: [1, 2, 3] },
  })
})

// Error responses
router.get('/api/error', (c) => {
  return c.error('Not found', 404)
})

// Success responses
router.post('/api/users', (c) => {
  return c.success('User created', 201)
})

// HTML responses
router.get('/page', async (c) => {
  const html = await c.readHtml('./templates/page.html')
  return c.html(html)
})

// File downloads
router.get('/download/:file', (c) => {
  return c.sendFile(`./files/${c.params.file}`)
})

// Redirects
router.get('/old-path', (c) => {
  return c.redirect('/new-path')
})

// Query parameters
router.get('/search', (c) => {
  const query = c.query.get('q')
  return c.json({ query })
})
```

### Route Parameters

The router supports type-safe route parameters with context:

```typescript
// Parameters are automatically typed
router.get('/users/:id', (c) => {
  // c.params.id is typed as string
  return c.json({ userId: c.params.id })
})

// Multiple parameters
router.get('/users/:userId/posts/:postId', (c) => {
  // Both c.params.userId and c.params.postId are typed
  const { userId, postId } = c.params
  return c.json({ userId, postId })
})
```

### HTTP Methods

Supported HTTP methods with context:

```typescript
router.get('/users', (c) =>
  c.json({
    /* ... */
  })
)
router.post('/users', (c) =>
  c.json({
    /* ... */
  })
)
router.put('/users/:id', (c) =>
  c.json({
    /* ... */
  })
)
router.delete('/users/:id', (c) =>
  c.json({
    /* ... */
  })
)
```

### Static Files
```typescript
// Basic usage - serves files from ./public directory
 router.use(Static())

 // Advanced configuration
 router.use(Static({
   // Serve files from this directory
   dir: "assets",

   // Serve under this URL prefix
   prefix: "/public",

   // Custom index file
   index: "main.html",

   // Enable directory listing
   listing: true,

   // SPA mode - serve index.html for missing files
   spa: true,

   // Custom MIME types
   mimeTypes: {
     'webp': 'image/webp',
     'mp4': 'video/mp4'
   }
 }))
```

### Type Safety

The router provides full TypeScript support:

```typescript
// Route parameters are automatically inferred
router.get('/users/:id/posts/:postId', (c) => {
  // TypeScript knows about these parameters
  const { id, postId } = c.params
  return c.json({ id, postId })
})
```

## Middleware

[Previous middleware documentation remains the same...]

## Error Handling

The router includes built-in error handling with context:

```typescript
router.get('/api/data', async (c) => {
  try {
    const data = await fetchData()
    return c.json(data)
  } catch (error) {
    return c.error('Internal Server Error', 500)
  }
})
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this in your own projects!
