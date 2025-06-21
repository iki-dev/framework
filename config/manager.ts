import { ConfigLoader } from "./loader.js";
import { ConfigParser } from "./parser.js";
import { ConfigValue } from "../types/common.js";

export class ConfigManager {
  private static _instance: ConfigManager;
  private _loader: ConfigLoader;
  private _cache: Map<string, ConfigValue> = new Map();

  private constructor() {
    this._loader = ConfigLoader.getInstance();
  }

  public static getInstance(): ConfigManager {
    if (!this._instance) {
      this._instance = new ConfigManager();
    }
    return this._instance;
  }

  public load(baseDir?: string): void {
    this._loader.load(baseDir);
    this._cache.clear();
  }

  public get<T = string>(path: string, defaultValue?: T): T {
    ConfigParser.validatePath(path);

    const type = this.inferType(defaultValue);
    const cacheKey = `${path}:${type}`;

    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey) as T;
    }

    const envKey = ConfigParser.pathToEnvKey(path);
    const rawValue = this._loader.get(envKey);

    if (rawValue === undefined) {
      if (defaultValue !== undefined) {
        this._cache.set(cacheKey, defaultValue as ConfigValue);
        return defaultValue;
      }
      return undefined as T;
    }

    const parsedValue = this.parseValue(rawValue, defaultValue);
    this._cache.set(cacheKey, parsedValue as ConfigValue);
    return parsedValue as T;
  }

  private inferType(value: unknown): string {
    if (value === undefined || value === null) return "string";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    return "string";
  }

  private parseValue<T>(rawValue: string, defaultValue?: T): unknown {
    const type = this.inferType(defaultValue);

    if (type === "number") {
      const num = Number(rawValue);
      if (isNaN(num)) {
        throw new Error(`Cannot parse "${rawValue}" as number`);
      }
      return num;
    }

    if (type === "boolean") {
      const lowerValue = rawValue.toLowerCase();
      if (["true", "1", "yes", "on"].includes(lowerValue)) {
        return true;
      }
      if (["false", "0", "no", "off"].includes(lowerValue)) {
        return false;
      }
      throw new Error(`Cannot parse "${rawValue}" as boolean`);
    }

    return rawValue;
  }

  public set(path: string, value: ConfigValue): void {
    ConfigParser.validatePath(path);
    const envKey = ConfigParser.pathToEnvKey(path);
    const stringValue = String(value);

    process.env[envKey] = stringValue;
    this._loader.getAll()[envKey] = stringValue;

    this._cache.clear();
  }

  public has(path: string): boolean {
    ConfigParser.validatePath(path);
    const envKey = ConfigParser.pathToEnvKey(path);
    return this._loader.get(envKey) !== undefined;
  }

  public all(): Record<string, string> {
    const allVars = this._loader.getAll();
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(allVars)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }

    return result;
  }

  public clear(): void {
    this._cache.clear();
  }
}
