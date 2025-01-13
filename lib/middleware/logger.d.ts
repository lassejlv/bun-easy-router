type Next = () => Promise<Response> | Response;
interface LoggerOptions {
    enabled?: boolean;
    showTimestamp?: boolean;
    showDuration?: boolean;
}
export declare function Logger(options?: LoggerOptions): (request: Request, next: Next) => Promise<Response>;
export {};
