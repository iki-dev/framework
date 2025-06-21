import {
  BaseValidator,
  ValidationResult,
  createValidationResult,
  Validator,
} from "../base.js";

export class NullableValidator<T> extends BaseValidator<unknown, T | null> {
  constructor(private innerValidator: Validator<unknown, T>) {
    super();
  }

  protected _validate(value: unknown): ValidationResult<T | null> {
    if (value === null) {
      return createValidationResult(true, null);
    }

    return this.innerValidator.validate(value);
  }

  protected async _validateAsync(
    value: unknown,
  ): Promise<ValidationResult<T | null>> {
    if (value === null) {
      return createValidationResult(true, null);
    }

    return await this.innerValidator.validateAsync(value);
  }
}
