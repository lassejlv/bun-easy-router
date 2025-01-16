import { join } from "path";
import fs from "fs"

type Next = () => Promise<Response> | Response;

interface StaticOptions {
  /**
   * Root directory to serve files from
   */
  dir?: string;

  /**
   * URL path prefix
   * @example '/public' will serve files from {dir} at /public/*
   */
  prefix?: string;

  /**
   * Index file to serve for directories
   * @default 'index.html'
   */
  index?: string;

  /**
   * Custom MIME types in addition to the default ones
   */
  mimeTypes?: Record<string, string>;

  /**
   * Enable directory listing
   * @default false
   */
  listing?: boolean;

  /**
   * Enable single page application mode
   * Serves index.html for missing files
   * @default false
   */
  spa?: boolean;
}

const defaultMimeTypes: Record<string, string> = {
  // Text
  'html': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'txt': 'text/plain',
  'xml': 'text/xml',
  // Images
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  // Fonts
  'woff': 'font/woff',
  'woff2': 'font/woff2',
  'ttf': 'font/ttf',
  'otf': 'font/otf',
  // Other
  'json': 'application/json',
  'pdf': 'application/pdf',
  'zip': 'application/zip',
};

const defaultOptions: Required<StaticOptions> = {
  dir: "public",
  prefix: "",
  index: "index.html",
  mimeTypes: {},
  listing: false,
  spa: false,
};

function getMimeType(filename: string, customMimeTypes: Record<string, string>): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return customMimeTypes[ext] || defaultMimeTypes[ext] || 'application/octet-stream';
}

function generateDirectoryListing(path: string, files: string[]): string {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Directory: ${path}</title>
        <style>
          body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 2rem; }
          .list { list-style: none; padding: 0; }
          .list li { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
          .list a { color: #2563eb; text-decoration: none; }
          .list a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>Directory: ${path}</h1>
        <ul class="list">
          ${path !== '/' ? '<li><a href="../">../</a></li>' : ''}
          ${files.map(file => `<li><a href="./${file}">${file}${file.includes('.') ? '' : '/'}</a></li>`).join('\n')}
        </ul>
      </body>
    </html>
  `;
  return html;
}

export function Static(options: StaticOptions = {}) {
  const resolvedOptions: Required<StaticOptions> = {
    ...defaultOptions,
    ...options,
    mimeTypes: { ...defaultMimeTypes, ...options.mimeTypes }
  };

  return async (request: Request, next: Next): Promise<Response> => {
    const url = new URL(request.url);
    let path = decodeURIComponent(url.pathname);

    // Check if path starts with prefix
    if (resolvedOptions.prefix) {
      if (!path.startsWith(resolvedOptions.prefix)) {
        return next();
      }
      path = path.slice(resolvedOptions.prefix.length);
    }

    // Normalize path and join with root directory
    path = path.replace(/^\/+/, '');
    const fullPath = join(resolvedOptions.dir, path);

    try {
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        // Check for index file
        const indexPath = join(fullPath, resolvedOptions.index);
        try {
          const indexStats = fs.statSync(indexPath);
          if (indexStats.isFile()) {
            const file = fs.readFileSync(indexPath);
            return new Response(file, {
              headers: {
                'Content-Type': getMimeType(resolvedOptions.index, resolvedOptions.mimeTypes)
              }
            });
          }
        } catch (e) {
          // Index file doesn't exist
        }

        // Directory listing
        if (resolvedOptions.listing) {
          const files = fs.readdirSync(fullPath);
          const listing = generateDirectoryListing(path, files);
          return new Response(listing, {
            headers: { 'Content-Type': 'text/html' }
          });
        }

        return next();
      }

      if (stats.isFile()) {
        const file = Bun.file(fullPath);
        return new Response(file, {
          headers: {
            'Content-Type': getMimeType(fullPath, resolvedOptions.mimeTypes)
          }
        });
      }

      return next();
    } catch (error) {
      // File not found
      if (resolvedOptions.spa) {
        try {
          const indexPath = join(resolvedOptions.dir, resolvedOptions.index);
          const file = Bun.file(indexPath);
          return new Response(file, {
            headers: {
              'Content-Type': getMimeType(resolvedOptions.index, resolvedOptions.mimeTypes)
            }
          });
        } catch (e) {
          return next();
        }
      }
      return next();
    }
  };
}
