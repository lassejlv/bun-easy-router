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
export declare function Static(options?: StaticOptions): (request: Request, next: Next) => Promise<Response>;
export {};
