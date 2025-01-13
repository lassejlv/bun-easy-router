import { Route } from './context';
type ExtractRouteParams<T extends string> = string extends T ? RouteParams : T extends `${infer Start}:${infer Param}/${infer Rest}` ? {
    [K in Param | keyof ExtractRouteParams<Rest>]: string;
} : T extends `${infer Start}:${infer Param}` ? {
    [K in Param]: string;
} : {};
interface RouteParams {
    [key: string]: string;
}
type Next = () => Promise<Response> | Response;
type Middleware = (request: Request, next: Next) => Promise<Response> | Response;
type RouteHandler<T extends string> = (c: Omit<Route, 'params'> & {
    params: ExtractRouteParams<T>;
}) => Response | Promise<Response>;
declare class Router {
    private request;
    private routes;
    private middlewares;
    constructor(request: Request);
    private parsePathPattern;
    private addRoute;
    private findRoute;
    use(middleware: Middleware): this;
    private executeMiddlewareChain;
    get<T extends string>(path: T, handler: RouteHandler<T>): this;
    post<T extends string>(path: T, handler: RouteHandler<T>): this;
    put<T extends string>(path: T, handler: RouteHandler<T>): this;
    delete<T extends string>(path: T, handler: RouteHandler<T>): this;
    run(): Promise<Response>;
}
declare function createRouter(request: Request): Router;
export default createRouter;
