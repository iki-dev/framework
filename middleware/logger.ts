import { Middleware, NextFunction } from "../http/middleware.js";
import { Request } from "../http/request.js";
import { Response } from "../http/response.js";

export class LoggerMiddleware extends Middleware {
  public async handle(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    const start = Date.now();
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] ${request.method} ${request.url} - Started`);

    await next();

    const duration = Date.now() - start;
    const statusCode = response.statusCode;

    console.log(
      `[${timestamp}] ${request.method} ${request.url} - ${statusCode} (${duration}ms)`,
    );
  }
}
