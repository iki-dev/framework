import {
  BaseValidator,
  ValidationResult,
  createValidationError,
  createValidationResult,
  Validator,
} from "../base.js";

export class UnionValidator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends readonly Validator<any, any>[],
> extends BaseValidator<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T[number] extends Validator<any, infer U> ? U : never
> {
  constructor(private validators: T) {
    super();
  }

  protected _validate(
    value: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): ValidationResult<T[number] extends Validator<any, infer U> ? U : never> {
    const errors: unknown[] = [];

    for (const validator of this.validators) {
      const result = validator.validate(value);
      if (result.success) {
        return result;
      }
      errors.push(...(result.errors || []));
    }

    return createValidationResult(false, undefined, [
      createValidationError(
        "",
        "Value does not match any of the expected types",
        value,
      ),
    ]);
  }

  protected async _validateAsync(value: unknown): Promise<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ValidationResult<T[number] extends Validator<any, infer U> ? U : never>
  > {
    const errors: unknown[] = [];

    for (const validator of this.validators) {
      const result = await validator.validateAsync(value);
      if (result.success) {
        return result;
      }
      errors.push(...(result.errors || []));
    }

    return createValidationResult(false, undefined, [
      createValidationError(
        "",
        "Value does not match any of the expected types",
        value,
      ),
    ]);
  }
}
