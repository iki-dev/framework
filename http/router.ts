import { HttpMethod } from "./http.js";
import { Middleware } from "./middleware.js";
import { Route } from "./route.js";
import { Handler } from "./handler.js";

export interface RouteMatch {
  route: Route;
  parameters: Record<string, string>;
}

export class Router {
  private routesByMethod: Record<HttpMethod, Route[]> = {
    GET: [],
    POST: [],
    PUT: [],
    DELETE: [],
    PATCH: [],
    OPTIONS: [],
    HEAD: [],
  };
  private _middleware: Middleware[] = [];

  constructor() {}

  public use(middleware: Middleware): this {
    this._middleware.push(middleware);
    return this;
  }

  public middleware(): Middleware[] {
    return [...this._middleware];
  }

  private addRoute(route: Route): void {
    this.routesByMethod[route.method].push(route);
  }

  private route(
    method: HttpMethod,
    path: string,
    handler: Handler,
    middleware?: Middleware[],
  ): void {
    const route: Route = {
      method,
      path,
      handler,
      middleware: middleware || [],
    };
    this.addRoute(route);
  }

  private pathToRegex(path: string): { regex: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];

    // Replace parameters like :id with named capture groups
    const regexPattern = path.replace(/:([^/]+)/g, (match, paramName) => {
      paramNames.push(paramName);
      return "([^/]+)";
    });

    // Ensure exact match
    const regex = new RegExp(`^${regexPattern}$`);

    return { regex, paramNames };
  }

  private matchRoute(
    routePath: string,
    requestPath: string,
  ): Record<string, string> | null {
    const { regex, paramNames } = this.pathToRegex(routePath);
    const match = requestPath.match(regex);

    if (!match) {
      return null;
    }

    const parameters: Record<string, string> = {};

    // Extract parameter values from capture groups
    for (let i = 0; i < paramNames.length; i++) {
      parameters[paramNames[i]] = match[i + 1];
    }

    return parameters;
  }

  // HTTP method methods
  public get(path: string, handler: Handler, middleware?: Middleware[]): void {
    this.route("GET", path, handler, middleware);
  }

  public post(path: string, handler: Handler, middleware?: Middleware[]): void {
    this.route("POST", path, handler, middleware);
  }

  public put(path: string, handler: Handler, middleware?: Middleware[]): void {
    this.route("PUT", path, handler, middleware);
  }

  public delete(
    path: string,
    handler: Handler,
    middleware?: Middleware[],
  ): void {
    this.route("DELETE", path, handler, middleware);
  }

  public patch(
    path: string,
    handler: Handler,
    middleware?: Middleware[],
  ): void {
    this.route("PATCH", path, handler, middleware);
  }

  public options(
    path: string,
    handler: Handler,
    middleware?: Middleware[],
  ): void {
    this.route("OPTIONS", path, handler, middleware);
  }

  public head(path: string, handler: Handler, middleware?: Middleware[]): void {
    this.route("HEAD", path, handler, middleware);
  }

  public resolve(method: HttpMethod, path: string): RouteMatch | undefined {
    const routes = this.routesByMethod[method];

    for (const route of routes) {
      const parameters = this.matchRoute(route.path, path);
      if (parameters !== null) {
        return {
          route,
          parameters,
        };
      }
    }

    return undefined;
  }
}

export const router = new Router();
