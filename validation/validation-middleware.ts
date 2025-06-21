import { Middleware, NextFunction } from "../http/middleware.js";
import { Request } from "../http/request.js";
import { Response } from "../http/response.js";
import { Validator, ValidationError, prefixFieldPath } from "./index.js";

export interface ValidationSchemas {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: Validator<any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: Validator<any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Validator<any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers?: Validator<any, any>;
}

export interface ValidationOptions {
  /**
   * HTTP status code to return on validation error
   * @default 422
   */
  statusCode?: number;

  /**
   * Whether to abort on first validation error or collect all errors
   * @default false (collect all errors)
   */
  abortEarly?: boolean;

  /**
   * Custom error message for validation failures
   */
  message?: string;

  /**
   * Custom error formatter function
   */
  formatErrors?: (errors: ValidationError[]) => unknown;
}

export class ValidationMiddleware extends Middleware {
  constructor(
    private schemas: ValidationSchemas,
    private options: ValidationOptions = {},
  ) {
    super();
  }

  public async handle(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    const allErrors: ValidationError[] = [];
    const validatedData: Record<string, unknown> = {};

    // Validate body
    if (this.schemas.body) {
      const bodyData = request.body;
      const result = await this.schemas.body.validateAsync(bodyData);

      if (!result.success) {
        const prefixedErrors = prefixFieldPath(result.errors || [], "body");
        allErrors.push(...prefixedErrors);

        if (this.options.abortEarly) {
          return this.sendValidationError(response, allErrors);
        }
      } else {
        validatedData.body = result.data;
      }
    }

    // Validate query parameters
    if (this.schemas.query) {
      const queryData = request.allQuery;
      const result = await this.schemas.query.validateAsync(queryData);

      if (!result.success) {
        const prefixedErrors = prefixFieldPath(result.errors || [], "query");
        allErrors.push(...prefixedErrors);

        if (this.options.abortEarly) {
          return this.sendValidationError(response, allErrors);
        }
      } else {
        validatedData.query = result.data;
      }
    }

    // Validate route parameters
    if (this.schemas.params) {
      // Get route parameters from request
      const paramsData: Record<string, string> = {};
      // This would need to be implemented based on how route parameters are stored
      // For now, we'll skip this validation

      const result = await this.schemas.params.validateAsync(paramsData);

      if (!result.success) {
        const prefixedErrors = prefixFieldPath(result.errors || [], "params");
        allErrors.push(...prefixedErrors);

        if (this.options.abortEarly) {
          return this.sendValidationError(response, allErrors);
        }
      } else {
        validatedData.params = result.data;
      }
    }

    // Validate headers
    if (this.schemas.headers) {
      const headersData = request.headers;
      const result = await this.schemas.headers.validateAsync(headersData);

      if (!result.success) {
        const prefixedErrors = prefixFieldPath(result.errors || [], "headers");
        allErrors.push(...prefixedErrors);

        if (this.options.abortEarly) {
          return this.sendValidationError(response, allErrors);
        }
      } else {
        validatedData.headers = result.data;
      }
    }

    // If there are validation errors, send error response
    if (allErrors.length > 0) {
      return this.sendValidationError(response, allErrors);
    }

    // Attach validated data to request object
    (request as Request & { validated: Record<string, unknown> }).validated =
      validatedData;

    await next();
  }

  private sendValidationError(
    response: Response,
    errors: ValidationError[],
  ): void {
    const statusCode = this.options.statusCode || 422;
    const message = this.options.message || "Validation failed";

    let formattedErrors: unknown;
    if (this.options.formatErrors) {
      formattedErrors = this.options.formatErrors(errors);
    } else {
      formattedErrors = errors.map((error) => ({
        field: error.field,
        message: error.message,
        ...(error.value !== undefined && { value: error.value }),
        ...(error.code && { code: error.code }),
      }));
    }

    response.status(statusCode).json({
      error: message,
      errors: formattedErrors,
    });
  }
}

/**
 * Helper function to create validation middleware
 */
export function validate(
  schemas: ValidationSchemas,
  options?: ValidationOptions,
): ValidationMiddleware {
  return new ValidationMiddleware(schemas, options);
}

/**
 * Helper to validate only request body
 */
export function validateBody(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validator: Validator<any, any>,
  options?: ValidationOptions,
): ValidationMiddleware {
  return validate({ body: validator }, options);
}

/**
 * Helper to validate only query parameters
 */
export function validateQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validator: Validator<any, any>,
  options?: ValidationOptions,
): ValidationMiddleware {
  return validate({ query: validator }, options);
}

/**
 * Helper to validate only route parameters
 */
export function validateParams(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validator: Validator<any, any>,
  options?: ValidationOptions,
): ValidationMiddleware {
  return validate({ params: validator }, options);
}

/**
 * Helper to validate only headers
 */
export function validateHeaders(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validator: Validator<any, any>,
  options?: ValidationOptions,
): ValidationMiddleware {
  return validate({ headers: validator }, options);
}

// Extend Request interface to include validated data
declare module "../http/request.js" {
  interface Request {
    validated?: {
      body?: unknown;
      query?: unknown;
      params?: unknown;
      headers?: unknown;
    };
  }
}
