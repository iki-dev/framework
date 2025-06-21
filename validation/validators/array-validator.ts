import {
  BaseValidator,
  ValidationResult,
  ValidationError,
  createValidationError,
  createValidationResult,
  mergeValidationErrors,
  prefixFieldPath,
  Validator,
} from "../base.js";

export class ArrayValidator<T = unknown> extends BaseValidator<unknown, T[]> {
  private rules: Array<(value: T[]) => ValidationResult<T[]>> = [];
  private asyncRules: Array<(value: T[]) => Promise<ValidationResult<T[]>>> =
    [];

  constructor(private itemValidator?: Validator<unknown, T>) {
    super();
  }

  protected _validate(value: unknown): ValidationResult<T[]> {
    if (value === null || value === undefined) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value is required", value),
      ]);
    }

    if (!Array.isArray(value)) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value must be an array", value),
      ]);
    }

    let processedValue = value;
    let allErrors: ValidationError[] = [];

    // Validate each item if itemValidator is provided
    if (this.itemValidator) {
      const validatedItems: T[] = [];
      for (let i = 0; i < processedValue.length; i++) {
        const itemResult = this.itemValidator.validate(processedValue[i]);
        if (!itemResult.success) {
          const prefixedErrors = prefixFieldPath(
            itemResult.errors || [],
            `[${i}]`,
          );
          allErrors = mergeValidationErrors(allErrors, prefixedErrors);
        } else {
          validatedItems.push(itemResult.data!);
        }
      }

      if (allErrors.length > 0) {
        return createValidationResult(false, undefined, allErrors);
      }

      processedValue = validatedItems;
    }

    // Apply array-level rules
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

  protected async _validateAsync(
    value: unknown,
  ): Promise<ValidationResult<T[]>> {
    if (value === null || value === undefined) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value is required", value),
      ]);
    }

    if (!Array.isArray(value)) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value must be an array", value),
      ]);
    }

    let processedValue = value;
    let allErrors: ValidationError[] = [];

    // Validate each item if itemValidator is provided
    if (this.itemValidator) {
      const validatedItems: T[] = [];
      for (let i = 0; i < processedValue.length; i++) {
        const itemResult = await this.itemValidator.validateAsync(
          processedValue[i],
        );
        if (!itemResult.success) {
          const prefixedErrors = prefixFieldPath(
            itemResult.errors || [],
            `[${i}]`,
          );
          allErrors = mergeValidationErrors(allErrors, prefixedErrors);
        } else {
          validatedItems.push(itemResult.data!);
        }
      }

      if (allErrors.length > 0) {
        return createValidationResult(false, undefined, allErrors);
      }

      processedValue = validatedItems;
    }

    // Apply array-level rules (sync first)
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

  public min(length: number, message?: string): this {
    this.rules.push((value) => {
      if (value.length < length) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || `Array must have at least ${length} items`,
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public max(length: number, message?: string): this {
    this.rules.push((value) => {
      if (value.length > length) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || `Array must have at most ${length} items`,
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public length(length: number, message?: string): this {
    this.rules.push((value) => {
      if (value.length !== length) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || `Array must have exactly ${length} items`,
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public nonempty(message?: string): this {
    return this.min(1, message || "Array cannot be empty");
  }

  public unique(message?: string): this {
    this.rules.push((value) => {
      const seen = new Set();
      for (const item of value) {
        const key = typeof item === "object" ? JSON.stringify(item) : item;
        if (seen.has(key)) {
          return createValidationResult(false, undefined, [
            createValidationError(
              "",
              message || "Array must contain unique items",
              value,
            ),
          ]);
        }
        seen.add(key);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public includes(item: T, message?: string): this {
    this.rules.push((value) => {
      if (!value.includes(item)) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || `Array must include ${item}`,
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public excludes(item: T, message?: string): this {
    this.rules.push((value) => {
      if (value.includes(item)) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || `Array must not include ${item}`,
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public custom(fn: (value: T[]) => boolean | string, message?: string): this {
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
    fn: (value: T[]) => Promise<boolean | string>,
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
}
