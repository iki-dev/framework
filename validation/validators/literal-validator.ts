import {
  BaseValidator,
  ValidationResult,
  createValidationError,
  createValidationResult,
} from "../base.js";

export class LiteralValidator<
  T extends string | number | boolean | null,
> extends BaseValidator<unknown, T> {
  constructor(private expectedValue: T) {
    super();
  }

  protected _validate(value: unknown): ValidationResult<T> {
    if (value === this.expectedValue) {
      return createValidationResult(true, value as T);
    }

    return createValidationResult(false, undefined, [
      createValidationError(
        "",
        `Value must be ${JSON.stringify(this.expectedValue)}`,
        value,
      ),
    ]);
  }

  protected async _validateAsync(value: unknown): Promise<ValidationResult<T>> {
    return this._validate(value);
  }
}
