import { Middleware, NextFunction } from "../http/middleware.js";
import { Request } from "../http/request.js";
import { Response } from "../http/response.js";
import { ApiSanitiser } from "./sanitisation-simple.js";

interface SanitisedRequest extends Request {
  _query: unknown;
  body: unknown;
  routeParameters: unknown;
  sanitisation: {
    sanitised: boolean;
    timestamp: Date;
  };
}

export interface SimpleSanitisationOptions {
  /**
   * Whether to sanitise query parameters
   * @default true
   */
  sanitiseQuery?: boolean;

  /**
   * Whether to sanitise request body
   * @default true
   */
  sanitiseBody?: boolean;

  /**
   * Whether to sanitise route parameters
   * @default true
   */
  sanitiseParams?: boolean;
}

/**
 * Simple sanitisation middleware for RESTful APIs
 * Provides basic XSS and SQL injection protection
 */
export class SimpleSanitisationMiddleware extends Middleware {
  private options: Required<SimpleSanitisationOptions>;

  constructor(options: SimpleSanitisationOptions = {}) {
    super();

    this.options = {
      sanitiseQuery: true,
      sanitiseBody: true,
      sanitiseParams: true,
      ...options,
    };
  }

  public async handle(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Sanitise query parameters
      if (this.options.sanitiseQuery) {
        const sanitisedQuery = ApiSanitiser.sanitiseObject(request.allQuery);
        (request as SanitisedRequest)._query = sanitisedQuery;
      }

      // Sanitise request body
      if (this.options.sanitiseBody && request.body !== undefined) {
        const sanitisedBody = ApiSanitiser.sanitiseObject(request.body);
        (request as SanitisedRequest).body = sanitisedBody;
      }

      // Sanitise route parameters
      if (this.options.sanitiseParams) {
        if (
          "routeParameters" in request &&
          typeof (request as SanitisedRequest).routeParameters === "object"
        ) {
          const sanitisedParams = ApiSanitiser.sanitiseObject(
            (request as SanitisedRequest).routeParameters,
          );
          (request as SanitisedRequest).routeParameters = sanitisedParams;
        }
      }

      // Mark request as sanitised
      (request as SanitisedRequest).sanitisation = {
        sanitised: true,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("[Sanitisation] Error during sanitisation:", error);
      // Continue processing even if sanitisation fails
    }

    await next();
  }
}

/**
 * Helper function to create simple sanitisation middleware
 */
export function sanitise(
  options?: SimpleSanitisationOptions,
): SimpleSanitisationMiddleware {
  return new SimpleSanitisationMiddleware(options);
}

/**
 * Helper to create sanitisation middleware for request body only
 */
export function sanitiseBody(
  options?: SimpleSanitisationOptions,
): SimpleSanitisationMiddleware {
  return new SimpleSanitisationMiddleware({
    ...options,
    sanitiseQuery: false,
    sanitiseBody: true,
    sanitiseParams: false,
  });
}

/**
 * Helper to create sanitisation middleware for query parameters only
 */
export function sanitiseQuery(
  options?: SimpleSanitisationOptions,
): SimpleSanitisationMiddleware {
  return new SimpleSanitisationMiddleware({
    ...options,
    sanitiseQuery: true,
    sanitiseBody: false,
    sanitiseParams: false,
  });
}

// Extend Request interface to include simple sanitisation metadata
declare module "../http/request.js" {
  interface Request {
    sanitisation?: {
      sanitised: boolean;
      timestamp: Date;
    };
  }
}
