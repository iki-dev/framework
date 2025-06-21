// Main framework exports
export { Application, ApplicationConfig } from "./application.js";

// HTTP-specific exports
export {
  // Core HTTP types and classes
  Request,
  Response,
  HttpMethod,
  HttpStatus,
  HttpStatusCode,
  ContentType,
  HeaderContentType,
  RequestHeaders,
  QueryParams,
  ResponseHeaders,

  // Routing
  Router,
  Route,
  RouteMatch,
  RouteBuilder,
  router,

  // Controllers and middleware
  Controller,
  Handler,
  ControllerMethod,
  Middleware,
  NextFunction,

  // Server and application
  HttpServer,
  HttpApplication,
  HttpAppConfig,
  HttpKernel,

  // File uploads
  UploadedFile,

  // Factory functions
  response,
} from "./http/index.js";

// Middleware exports
export {
  CorsMiddleware,
  LoggerMiddleware,
  BodyParserMiddleware,
} from "./middleware/index.js";

// Database exports
export {
  Model,
  DatabaseManager,
  QueryBuilder,
  DatabaseDriver,
  SqliteDriver,
} from "./database/index.js";

// Validation exports
export {
  // Core validation types and utilities
  ValidationError,
  ValidationResult,
  Validator,
  InferType,
  BaseValidator,
  createValidationError,
  createValidationResult,
  mergeValidationErrors,
  prefixFieldPath,

  // Schema factory
  Schema,

  // Validator classes
  StringValidator,
  NumberValidator,
  BooleanValidator,
  ArrayValidator,
  ObjectValidator,
  OptionalValidator,
  NullableValidator,
  UnionValidator,
  LiteralValidator,

  // Validation middleware
  ValidationSchemas,
  ValidationOptions,
  ValidationMiddleware,
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
} from "./validation/index.js";

// Configuration exports
export {
  // Config helper functions
  config,
  loadConfig,
  hasConfig,
  setConfig,
  allConfig,

  // Config types and classes
  ConfigManager,
  ConfigLoader,
  EnvVars,
  ConfigParser,
} from "./config/index.js";
