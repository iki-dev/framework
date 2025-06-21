import {
  BaseValidator,
  ValidationResult,
  createValidationError,
  createValidationResult,
} from "../base.js";

export class StringValidator extends BaseValidator<unknown, string> {
  private rules: Array<(value: string) => ValidationResult<string>> = [];
  private asyncRules: Array<
    (value: string) => Promise<ValidationResult<string>>
  > = [];

  protected _validate(value: unknown): ValidationResult<string> {
    if (value === null || value === undefined) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value is required", value),
      ]);
    }

    if (typeof value !== "string") {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value must be a string", value),
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
  ): Promise<ValidationResult<string>> {
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

  public min(length: number, message?: string): this {
    this.rules.push((value) => {
      if (value.length < length) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || `String must be at least ${length} characters long`,
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
            message || `String must be at most ${length} characters long`,
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
            message || `String must be exactly ${length} characters long`,
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public email(message?: string): this {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.rules.push((value) => {
      if (!emailRegex.test(value)) {
        return createValidationResult(false, undefined, [
          createValidationError("", message || "Invalid email address", value),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public url(message?: string): this {
    this.rules.push((value) => {
      try {
        new URL(value);
        return createValidationResult(true, value);
      } catch {
        return createValidationResult(false, undefined, [
          createValidationError("", message || "Invalid URL", value),
        ]);
      }
    });
    return this;
  }

  public pattern(regex: RegExp, message?: string): this {
    this.rules.push((value) => {
      if (!regex.test(value)) {
        return createValidationResult(false, undefined, [
          createValidationError(
            "",
            message || `String does not match pattern ${regex}`,
            value,
          ),
        ]);
      }
      return createValidationResult(true, value);
    });
    return this;
  }

  public matches(regex: RegExp, message?: string): this {
    return this.pattern(regex, message);
  }

  public uuid(message?: string): this {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return this.pattern(uuidRegex, message || "Invalid UUID");
  }

  public alphanumeric(message?: string): this {
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    return this.pattern(
      alphanumericRegex,
      message || "String must contain only letters and numbers",
    );
  }

  public alphabetic(message?: string): this {
    const alphabeticRegex = /^[a-zA-Z]+$/;
    return this.pattern(
      alphabeticRegex,
      message || "String must contain only letters",
    );
  }

  public numeric(message?: string): this {
    const numericRegex = /^[0-9]+$/;
    return this.pattern(
      numericRegex,
      message || "String must contain only numbers",
    );
  }

  public trim(): this {
    this.rules.push((value) => {
      return createValidationResult(true, value.trim());
    });
    return this;
  }

  public lowercase(): this {
    this.rules.push((value) => {
      return createValidationResult(true, value.toLowerCase());
    });
    return this;
  }

  public uppercase(): this {
    this.rules.push((value) => {
      return createValidationResult(true, value.toUpperCase());
    });
    return this;
  }

  public custom(
    fn: (value: string) => boolean | string,
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
    fn: (value: string) => Promise<boolean | string>,
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
