export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
  code?: string;
}

export type ValidationResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

export interface Validator<TInput = unknown, TOutput = TInput> {
  validate(value: TInput): ValidationResult<TOutput>;
  validateAsync(value: TInput): Promise<ValidationResult<TOutput>>;
}

export abstract class BaseValidator<TInput = unknown, TOutput = TInput>
  implements Validator<TInput, TOutput>
{
  protected abstract _validate(value: TInput): ValidationResult<TOutput>;
  protected abstract _validateAsync(
    value: TInput,
  ): Promise<ValidationResult<TOutput>>;

  public validate(value: TInput): ValidationResult<TOutput> {
    try {
      return this._validate(value);
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            field: "",
            message:
              error instanceof Error ? error.message : "Validation failed",
          },
        ],
      };
    }
  }

  public async validateAsync(
    value: TInput,
  ): Promise<ValidationResult<TOutput>> {
    try {
      return await this._validateAsync(value);
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            field: "",
            message:
              error instanceof Error ? error.message : "Validation failed",
          },
        ],
      };
    }
  }
}

export function createValidationError(
  field: string,
  message: string,
  value?: unknown,
  code?: string,
): ValidationError {
  return { field, message, value, code };
}

export function createValidationResult<T>(
  success: true,
  data: T,
): { success: true; data: T };
export function createValidationResult(
  success: false,
  data: undefined,
  errors: ValidationError[],
): { success: false; errors: ValidationError[] };
export function createValidationResult<T>(
  success: boolean,
  data: T | undefined,
  errors?: ValidationError[],
): ValidationResult<T> {
  if (success) {
    return { success: true, data: data as T };
  } else {
    return { success: false, errors: errors || [] };
  }
}

export function mergeValidationErrors(
  ...errorArrays: ValidationError[][]
): ValidationError[] {
  return errorArrays.flat();
}

export function prefixFieldPath(
  errors: ValidationError[],
  prefix: string,
): ValidationError[] {
  return errors.map((error) => ({
    ...error,
    field: prefix ? `${prefix}.${error.field}` : error.field,
  }));
}
