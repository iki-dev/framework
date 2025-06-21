import {
  BaseValidator,
  ValidationResult,
  createValidationError,
  createValidationResult,
} from "../base.js";

export class NumberValidator extends BaseValidator<unknown, number> {
  private rules: Array<(value: number) => ValidationResult<number>> = [];
  private asyncRules: Array<
    (value: number) => Promise<ValidationResult<number>>
  > = [];

  protected _validate(value: unknown): ValidationResult<number> {
    if (value === null || value === undefined) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value is required", value),
      ]);
    }

    // Convert string numbers to number
    if (typeof value === "string") {
      const parsed = Number(value);
      if (isNaN(parsed)) {
        return createValidationResult(false, undefined, [
          createValidationError("", "Value must be a number", value),
        ]);
      }
      value = parsed;
    }

    if (typeof value !== "number") {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value must be a number", value),
      ]);
    }

    if (isNaN(value)) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value must be a valid number", value),
      ]);
    }

    let processedValue = value;

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
  ): Promise<ValidationResult<number>> {
    const syncResult = this._validate(value);
    if (!syncResult.success) {
      return syncResult;
    }

    let processedValue = syncResult.data!;

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

  public min(min: number, message?: string): this {
    this.rules.push((value) => {
      if (value < min) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || `Number must be at least ${min}`,
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public max(max: number, message?: string): this {
    this.rules.push((value) => {
      if (value > max) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || `Number must be at most ${max}`,
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public integer(message?: string): this {
    this.rules.push((value) => {
      if (!Number.isInteger(value)) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || "Number must be an integer",
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public positive(message?: string): this {
    this.rules.push((value) => {
      if (value <= 0) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || "Number must be positive",
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public negative(message?: string): this {
    this.rules.push((value) => {
      if (value >= 0) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || "Number must be negative",
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public nonNegative(message?: string): this {
    this.rules.push((value) => {
      if (value < 0) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || "Number must be non-negative",
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public nonPositive(message?: string): this {
    this.rules.push((value) => {
      if (value > 0) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || "Number must be non-positive",
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public multipleOf(factor: number, message?: string): this {
    this.rules.push((value) => {
      if (value % factor !== 0) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || `Number must be a multiple of ${factor}`,
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public finite(message?: string): this {
    this.rules.push((value) => {
      if (!Number.isFinite(value)) {
        return createValidationResult(false, undefined, [
          createValidationError("", message || "Number must be finite", value),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public safe(message?: string): this {
    this.rules.push((value) => {
      if (!Number.isSafeInteger(value)) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || "Number must be a safe integer",
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public between(min: number, max: number, message?: string): this {
    this.rules.push((value) => {
      if (value < min || value > max) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || `Number must be between ${min} and ${max}`,
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public round(): this {
    this.rules.push((value) => {
      return createValidationResult(true, Math.round(value));
    });
    return this;
  }

  public floor(): this {
    this.rules.push((value) => {
      return createValidationResult(true, Math.floor(value));
    });
    return this;
  }

  public ceil(): this {
    this.rules.push((value) => {
      return createValidationResult(true, Math.ceil(value));
    });
    return this;
  }

  public custom(
    fn: (value: number) => boolean | string,
    message?: string,
  ): this {
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
    fn: (value: number) => Promise<boolean | string>,
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

  public int(message?: string): this {
    return this.integer(message);
  }
}
