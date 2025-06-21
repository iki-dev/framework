import { HttpMethod } from "./http.js";
import { Controller, ControllerMethod, Handler } from "./controller.js";
import { Middleware } from "./middleware.js";
import { Route } from "./route.js";

export class RouteBuilder {
  private routeMiddleware: Middleware[] = [];

  constructor(
    private method: HttpMethod,
    private path: string,
    private onComplete: (route: Route) => void,
  ) {}

  public use(middleware: Middleware): this {
    this.routeMiddleware.push(middleware);
    return this;
  }

  public handler<C extends Controller>(
    controller: C,
    methodName: ControllerMethod<C>,
  ): void {
    const handler: Handler = (request) => {
      const controllerMethod = controller[methodName] as Handler;
      return controllerMethod.call(controller, request);
    };

    const route: Route = {
      method: this.method,
      path: this.path,
      handler,
      middleware: this.routeMiddleware,
    };

    this.onComplete(route);
  }

  public rawHandler(handler: Handler): void {
    const route: Route = {
      method: this.method,
      path: this.path,
      handler,
      middleware: this.routeMiddleware,
    };

    this.onComplete(route);
  }
}
