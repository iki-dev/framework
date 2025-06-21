import {
  BaseValidator,
  ValidationResult,
  createValidationResult,
  Validator,
} from "../base.js";

export class OptionalValidator<T> extends BaseValidator<
  unknown,
  T | undefined
> {
  constructor(private innerValidator: Validator<unknown, T>) {
    super();
  }

  protected _validate(value: unknown): ValidationResult<T | undefined> {
    if (value === undefined) {
      return createValidationResult(true, undefined);
    }

    return this.innerValidator.validate(value);
  }

  protected async _validateAsync(
    value: unknown,
  ): Promise<ValidationResult<T | undefined>> {
    if (value === undefined) {
      return createValidationResult(true, undefined);
    }

    return await this.innerValidator.validateAsync(value);
  }
}
