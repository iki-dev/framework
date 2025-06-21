import { StringValidator } from "./validators/string-validator.js";
import { NumberValidator } from "./validators/number-validator.js";
import { BooleanValidator } from "./validators/boolean-validator.js";
import { ArrayValidator } from "./validators/array-validator.js";
import { ObjectValidator } from "./validators/object-validator.js";
import { OptionalValidator } from "./validators/optional-validator.js";
import { NullableValidator } from "./validators/nullable-validator.js";
import { UnionValidator } from "./validators/union-validator.js";
import { LiteralValidator } from "./validators/literal-validator.js";
import type { Validator } from "./index.js";

export class Schema {
  public static string(): StringValidator {
    return new StringValidator();
  }

  public static number(): NumberValidator {
    return new NumberValidator();
  }

  public static boolean(): BooleanValidator {
    return new BooleanValidator();
  }

  public static array<T>(
    itemValidator?: Validator<unknown, T>,
  ): ArrayValidator<T> {
    return new ArrayValidator(itemValidator);
  }

  public static object<T extends Record<string, unknown>>(shape?: {
    [K in keyof T]: Validator<unknown, T[K]>;
  }): ObjectValidator<T> {
    return new ObjectValidator(shape);
  }

  public static optional<T>(
    validator: Validator<unknown, T>,
  ): OptionalValidator<T> {
    return new OptionalValidator(validator);
  }

  public static nullable<T>(
    validator: Validator<unknown, T>,
  ): NullableValidator<T> {
    return new NullableValidator(validator);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static union<T extends readonly Validator<any, any>[]>(
    ...validators: T
  ): UnionValidator<T> {
    return new UnionValidator(validators);
  }

  public static literal<T extends string | number | boolean | null>(
    value: T,
  ): LiteralValidator<T> {
    return new LiteralValidator(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static any(): Validator<any, any> {
    return {
      validate: (value) => ({ success: true, data: value }),
      validateAsync: async (value) => ({ success: true, data: value }),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static never(): Validator<any, never> {
    return {
      validate: () => ({
        success: false,
        errors: [{ field: "", message: "This field should not exist" }],
      }),
      validateAsync: async () => ({
        success: false,
        errors: [{ field: "", message: "This field should not exist" }],
      }),
    };
  }
}
