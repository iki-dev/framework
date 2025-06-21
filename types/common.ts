// Common type definitions used across the framework

export type RecordAny = Record<string, unknown>;
export type UnknownRecord = Record<string, unknown>;
export type ConfigValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ConfigObject
  | ConfigArray;
export type ConfigObject = { [key: string]: ConfigValue };
export type ConfigArray = ConfigValue[];

export type QueryValue = string | number | boolean | null;
export type QueryParams = QueryValue[];
export type QueryResult = Record<string, unknown>;

export type RouteParams = Record<string, string>;
export type Headers = Record<string, string | string[]>;
export type Files = Record<string, unknown>;

export type MiddlewareNext = () => Promise<void>;
