type Next = () => Promise<Response> | Response;
interface CorsOptions {
    origin?: string | string[] | ((origin: string) => boolean);
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
    preflight?: boolean;
}
export declare function Cors(options?: CorsOptions): (request: Request, next: Next) => Promise<Response>;
export {};
