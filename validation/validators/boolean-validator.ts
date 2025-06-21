import {
  BaseValidator,
  ValidationResult,
  createValidationError,
  createValidationResult,
} from "../base.js";

export class BooleanValidator extends BaseValidator<unknown, boolean> {
  private strict = false;

  protected _validate(value: unknown): ValidationResult<boolean> {
    if (value === null || value === undefined) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value is required", value),
      ]);
    }

    if (typeof value === "boolean") {
      return createValidationResult(true, value);
    }

    // In strict mode, only accept actual booleans
    if (this.strict) {
      return createValidationResult(false, undefined, [
        createValidationError("", "Value must be a boolean", value),
      ]);
    }

    // Convert truthy/falsy values to boolean
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (["true", "1", "yes", "on"].includes(lower)) {
        return createValidationResult(true, true);
      }
      if (["false", "0", "no", "off", ""].includes(lower)) {
        return createValidationResult(true, false);
      }
    }

    if (typeof value === "number") {
      return createValidationResult(true, Boolean(value));
    }

    return createValidationResult(false, undefined, [
      createValidationError(
        "",
        "Value must be a boolean or boolean-like value",
        value,
      ),
    ]);
  }

  protected async _validateAsync(
    value: unknown,
  ): Promise<ValidationResult<boolean>> {
    return this._validate(value);
  }

  public strictMode(): this {
    this.strict = true;
    return this;
  }
}
