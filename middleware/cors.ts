import { Middleware, NextFunction } from "../http/middleware.js";
import { Request } from "../http/request.js";
import { Response } from "../http/response.js";

export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export class CorsMiddleware extends Middleware {
  private options: CorsOptions;

  constructor(options: CorsOptions = {}) {
    super();
    this.options = {
      origin: options.origin ?? true,
      methods: options.methods ?? [
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "PATCH",
        "OPTIONS",
      ],
      allowedHeaders: options.allowedHeaders ?? [
        "Content-Type",
        "Authorization",
      ],
      credentials: options.credentials ?? false,
      maxAge: options.maxAge ?? 86400,
    };
  }

  public async handle(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    const origin = request.header("origin") as string;

    // Set CORS headers
    if (this.isOriginAllowed(origin)) {
      response.setHeader("Access-Control-Allow-Origin", origin || "*");
    }

    if (this.options.credentials) {
      response.setHeader("Access-Control-Allow-Credentials", "true");
    }

    response.setHeader(
      "Access-Control-Allow-Methods",
      this.options.methods!.join(", "),
    );
    response.setHeader(
      "Access-Control-Allow-Headers",
      this.options.allowedHeaders!.join(", "),
    );
    response.setHeader(
      "Access-Control-Max-Age",
      this.options.maxAge!.toString(),
    );

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    await next();
  }

  private isOriginAllowed(origin: string): boolean {
    if (this.options.origin === true) return true;
    if (this.options.origin === false) return false;
    if (typeof this.options.origin === "string")
      return this.options.origin === origin;
    if (Array.isArray(this.options.origin))
      return this.options.origin.includes(origin);
    return false;
  }
}
