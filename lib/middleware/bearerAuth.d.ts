type Next = () => Promise<Response> | Response;
interface AuthOptions {
    /**
     * Custom function to validate the token
     */
    validate?: (token: string) => Promise<boolean> | boolean;
    /**
     * List of paths to exclude from authentication
     * Supports string comparison and regex patterns
     */
    exclude?: (string | RegExp)[];
    /**
     * Custom error response when authentication fails
     */
    onError?: (error: Error) => Response | Promise<Response>;
    /**
     * Custom header name for the authorization token
     * @default 'Authorization'
     */
    header?: string;
    /**
     * Custom scheme for the authorization header
     * @default 'Bearer'
     */
    scheme?: string;
}
export declare function BearerAuth(options?: AuthOptions): (request: Request, next: Next) => Promise<Response>;
export {};
