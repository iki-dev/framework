// Re-export everything from base
export * from "./base.js";
import { Validator } from "./base.js";

export type InferType<T> = T extends Validator<unknown, infer U> ? U : never;

// Schema factory
export { Schema } from "./schema.js";

// Validator classes
export { StringValidator } from "./validators/string-validator.js";
export { NumberValidator } from "./validators/number-validator.js";
export { BooleanValidator } from "./validators/boolean-validator.js";
export { ArrayValidator } from "./validators/array-validator.js";
export { ObjectValidator } from "./validators/object-validator.js";
export { OptionalValidator } from "./validators/optional-validator.js";
export { NullableValidator } from "./validators/nullable-validator.js";
export { UnionValidator } from "./validators/union-validator.js";
export { LiteralValidator } from "./validators/literal-validator.js";

// Import validator classes for factory functions
import { StringValidator } from "./validators/string-validator.js";
import { NumberValidator } from "./validators/number-validator.js";
import { BooleanValidator } from "./validators/boolean-validator.js";
import { ArrayValidator } from "./validators/array-validator.js";
import { ObjectValidator } from "./validators/object-validator.js";
import { OptionalValidator } from "./validators/optional-validator.js";
import { NullableValidator } from "./validators/nullable-validator.js";
import { UnionValidator } from "./validators/union-validator.js";
import { LiteralValidator } from "./validators/literal-validator.js";

// Factory functions
export function string(): StringValidator {
  return new StringValidator();
}

export function number(): NumberValidator {
  return new NumberValidator();
}

export function boolean(): BooleanValidator {
  return new BooleanValidator();
}

export function array<T = unknown>(
  itemValidator?: Validator<unknown, T>,
): ArrayValidator<T> {
  return new ArrayValidator(itemValidator);
}

export function object<
  T extends Record<string, unknown> = Record<string, unknown>,
>(shape?: { [K in keyof T]: Validator<unknown, T[K]> }): ObjectValidator<T> {
  return new ObjectValidator(shape);
}

export function optional<T>(
  validator: Validator<unknown, T>,
): OptionalValidator<T> {
  return new OptionalValidator(validator);
}

export function nullable<T>(
  validator: Validator<unknown, T>,
): NullableValidator<T> {
  return new NullableValidator(validator);
}

export function union<T extends readonly Validator<unknown, unknown>[]>(
  ...validators: T
): UnionValidator<T> {
  return new UnionValidator(validators);
}

export function literal<T extends string | number | boolean | null>(
  value: T,
): LiteralValidator<T> {
  return new LiteralValidator(value);
}

// Validation middleware exports
export {
  ValidationSchemas,
  ValidationOptions,
  ValidationMiddleware,
} from "./validation-middleware.js";
export {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
} from "./validation-middleware.js";
