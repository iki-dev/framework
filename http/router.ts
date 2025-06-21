import { HttpMethod } from "./http.js";
import { Middleware } from "./middleware.js";
import { RouteBuilder } from "./route-builder.js";
import { Route } from "./route.js";

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

  public route(method: HttpMethod, path: string): RouteBuilder {
    return new RouteBuilder(method, path, (route) => this.addRoute(route));
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

  // Fluent API methods
  public get(path: string): RouteBuilder {
    return this.route("GET", path);
  }

  public post(path: string): RouteBuilder {
    return this.route("POST", path);
  }

  public put(path: string): RouteBuilder {
    return this.route("PUT", path);
  }

  public delete(path: string): RouteBuilder {
    return this.route("DELETE", path);
  }

  public patch(path: string): RouteBuilder {
    return this.route("PATCH", path);
  }

  public options(path: string): RouteBuilder {
    return this.route("OPTIONS", path);
  }

  public head(path: string): RouteBuilder {
    return this.route("HEAD", path);
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
