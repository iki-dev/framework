import { Request } from "./request.js";
import { Response } from "./response.js";
import { Router } from "./router.js";
import { Middleware } from "./middleware.js";
import { Handler } from "./handler.js";
import { HttpMethod } from "./http.js";
import { parse } from "node:url";

export class HttpKernel {
  private globalMiddleware: Middleware[] = [];
  private routers: Map<string, Router> = new Map();

  public use(middleware: Middleware): void {
    this.globalMiddleware.push(middleware);
  }

  public mount(path: string, router: Router): void {
    this.routers.set(path, router);
  }

  public async handle(request: Request): Promise<Response> {
    const response = new Response(200);

    try {
      // Find matching route
      const routeMatch = this.findRoute(request.method, request.url);

      if (!routeMatch) {
        response.status(404).send("Not Found");
        return response;
      }

      // Build middleware chain: global -> router -> route -> handler
      const middlewares = [
        ...this.globalMiddleware,
        ...routeMatch.routerMiddleware,
        ...routeMatch.routeMiddleware,
      ];

      // Create new request with route parameters
      const requestWithParams = new Request(
        request.method,
        request.url,
        request.headers,
        request.body,
        request.allQuery,
        routeMatch.parameters,
        request.allFiles,
      );

      // Execute middleware pipeline
      await this.executePipeline(
        middlewares,
        requestWithParams,
        response,
        routeMatch.handler,
      );
    } catch (error) {
      // If error occurs and response not sent, send error response
      if (!response.sent) {
        console.error("Unhandled error:", error);
        response.status(500).send("Internal Server Error");
      }
    }

    return response;
  }

  private findRoute(method: HttpMethod, url: string) {
    const parsedUrl = parse(url);
    const pathname = parsedUrl.pathname || "/";

    // Check each mounted router
    for (const [mountPath, router] of this.routers) {
      // Check if pathname starts with mount path
      if (pathname.startsWith(mountPath)) {
        // Remove mount path from pathname for router matching
        const routerPath =
          mountPath === "/"
            ? pathname
            : pathname.slice(mountPath.length) || "/";

        const match = router.resolve(method, routerPath);
        if (match) {
          return {
            ...match,
            handler: match.route.handler,
            routerMiddleware: router.middleware(),
            routeMiddleware: match.route.middleware || [],
          };
        }
      }
    }

    return null;
  }

  private async executePipeline(
    middlewares: Middleware[],
    request: Request,
    response: Response,
    handler: Handler,
  ): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (response.sent) return;

      if (index >= middlewares.length) {
        // All middleware executed, run handler
        const handlerResponse = await handler(request);

        // Copy handler response to our response object
        response.statusCode = handlerResponse.statusCode;

        // Copy headers
        for (const [key, value] of Object.entries(handlerResponse.headers)) {
          response.setHeader(key, value);
        }

        // Copy body
        if (handlerResponse.body !== undefined) {
          response.send(handlerResponse.body);
        }

        response.markSent();
        return;
      }

      const middleware = middlewares[index++];
      await middleware.handle(request, response, next);
    };

    await next();
  }
}
