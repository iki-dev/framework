import {
  BaseValidator,
  ValidationResult,
  createValidationError,
  createValidationResult,
  mergeValidationErrors,
  prefixFieldPath,
  Validator,
} from "../base.js";

export class ObjectValidator<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends BaseValidator<unknown, T> {
  private _strict = false;
  private rules: Array<(value: T) => ValidationResult<T>> = [];
  private asyncRules: Array<(value: T) => Promise<ValidationResult<T>>> = [];

  constructor(private shape?: { [K in keyof T]: Validator<unknown, T[K]> }) {
    super();
  }

  protected _validate(value: unknown): ValidationResult<T> {
    if (value === null || value === undefined) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value is required", value),
      ]);
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value must be an object", value),
      ]);
    }

    let processedValue = { ...value };
    let allErrors: unknown[] = [];

    // Validate shape if provided
    if (this.shape) {
      const validatedObject: Record<string, unknown> = {};

      // Validate required fields from shape
      for (const [key, validator] of Object.entries(this.shape)) {
        const fieldValue = processedValue[key];
        const fieldResult = validator.validate(fieldValue);

        if (!fieldResult.success) {
          const prefixedErrors = prefixFieldPath(fieldResult.errors || [], key);
          allErrors = mergeValidationErrors(allErrors, prefixedErrors);
        } else {
          validatedObject[key] = fieldResult.data;
        }
      }

      // In strict mode, reject extra properties
      if (this._strict) {
        const shapeKeys = Object.keys(this.shape);
        const valueKeys = Object.keys(processedValue);
        const extraKeys = valueKeys.filter((key) => !shapeKeys.includes(key));

        for (const extraKey of extraKeys) {
          allErrors.push(
            createValidationError(
              extraKey,
              "Unknown field",
              processedValue[extraKey],
            ),
          );
        }
      } else {
        // In non-strict mode, keep extra properties
        for (const [key, val] of Object.entries(processedValue)) {
          if (!(key in this.shape)) {
            validatedObject[key] = val;
          }
        }
      }

      if (allErrors.length > 0) {
        return createValidationResult(false, undefined, allErrors);
      }

      processedValue = validatedObject as T;
    }

    // Apply object-level rules
    for (const rule of this.rules) {
      const result = rule(processedValue);
      if (!result.success) {
        return result;
      }
      if (result.data !== undefined) {
        processedValue = result.data;
      }
    }

    return createValidationResult(true, processedValue);
  }

  protected async _validateAsync(value: unknown): Promise<ValidationResult<T>> {
    if (value === null || value === undefined) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value is required", value),
      ]);
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value must be an object", value),
      ]);
    }

    let processedValue = { ...value };
    let allErrors: unknown[] = [];

    // Validate shape if provided
    if (this.shape) {
      const validatedObject: Record<string, unknown> = {};

      // Validate required fields from shape
      for (const [key, validator] of Object.entries(this.shape)) {
        const fieldValue = processedValue[key];
        const fieldResult = await validator.validateAsync(fieldValue);

        if (!fieldResult.success) {
          const prefixedErrors = prefixFieldPath(fieldResult.errors || [], key);
          allErrors = mergeValidationErrors(allErrors, prefixedErrors);
        } else {
          validatedObject[key] = fieldResult.data;
        }
      }

      // In strict mode, reject extra properties
      if (this._strict) {
        const shapeKeys = Object.keys(this.shape);
        const valueKeys = Object.keys(processedValue);
        const extraKeys = valueKeys.filter((key) => !shapeKeys.includes(key));

        for (const extraKey of extraKeys) {
          allErrors.push(
            createValidationError(
              extraKey,
              "Unknown field",
              processedValue[extraKey],
            ),
          );
        }
      } else {
        // In non-strict mode, keep extra properties
        for (const [key, val] of Object.entries(processedValue)) {
          if (!(key in this.shape)) {
            validatedObject[key] = val;
          }
        }
      }

      if (allErrors.length > 0) {
        return createValidationResult(false, undefined, allErrors);
      }

      processedValue = validatedObject as T;
    }

    // Apply object-level rules (sync first)
    for (const rule of this.rules) {
      const result = rule(processedValue);
      if (!result.success) {
        return result;
      }
      if (result.data !== undefined) {
        processedValue = result.data;
      }
    }

    // Apply async rules
    for (const rule of this.asyncRules) {
      const result = await rule(processedValue);
      if (!result.success) {
        return result;
      }
      if (result.data !== undefined) {
        processedValue = result.data;
      }
    }

    return createValidationResult(true, processedValue);
  }

  public strictMode(): this {
    this._strict = true;
    return this;
  }

  public hasKey(key: string, message?: string): this {
    this.rules.push((value) => {
      if (!(key in value)) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || `Object must have key "${key}"`,
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public custom(fn: (value: T) => boolean | string, message?: string): this {
    this.rules.push((value) => {
      const result = fn(value);
      if (result === true) {
        return createValidationResult(true, value);
      }
      const errorMessage =
        typeof result === "string"
          ? result
          : message || "Custom validation failed";
      return createValidationResult(false, undefined, [
        createValidationError("", errorMessage, value),
      ]);
    });
    return this;
  }

  public customAsync(
    fn: (value: T) => Promise<boolean | string>,
    message?: string,
  ): this {
    this.asyncRules.push(async (value) => {
      const result = await fn(value);
      if (result === true) {
        return createValidationResult(true, value);
      }
      const errorMessage =
        typeof result === "string"
          ? result
          : message || "Custom validation failed";
      return createValidationResult(false, undefined, [
        createValidationError("", errorMessage, value),
      ]);
    });
    return this;
  }

  public get strict(): boolean {
    return this._strict;
  }
}
