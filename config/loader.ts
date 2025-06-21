import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface EnvVars {
  [key: string]: string | undefined;
}

export class ConfigLoader {
  private static _instance: ConfigLoader;
  private _envVars: EnvVars = {};

  private constructor() {}

  public static getInstance(): ConfigLoader {
    if (!this._instance) {
      this._instance = new ConfigLoader();
    }
    return this._instance;
  }

  public static resetInstance(): void {
    this._instance = undefined!;
  }

  public load(baseDir?: string): void {
    this._envVars = {};

    const dir = baseDir || process.cwd();
    const nodeEnv = process.env.NODE_ENV || "development";

    const originalEnv = { ...process.env };

    const envFiles = [
      ".env",
      ".env.local",
      `.env.${nodeEnv}`,
      `.env.${nodeEnv}.local`,
    ];

    for (const file of envFiles) {
      this.loadFile(join(dir, file));
    }

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value !== undefined) {
        process.env[key] = value;
      }
    }
  }

  private loadFile(filePath: string): void {
    if (!existsSync(filePath)) {
      return;
    }

    try {
      const content = readFileSync(filePath, "utf-8");
      const parsed = this.parse(content);

      for (const [key, value] of Object.entries(parsed)) {
        process.env[key] = value;
        this._envVars[key] = value;
      }
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error);
    }
  }

  private parse(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.substring(0, separatorIndex).trim();
      let value = trimmed.substring(separatorIndex + 1).trim();

      value = this.processValue(value);
      value = this.expandVariables(value, result);

      result[key] = value;
    }

    return result;
  }

  private processValue(value: string): string {
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    value = value.replace(/\\n/g, "\n");
    value = value.replace(/\\r/g, "\r");
    value = value.replace(/\\t/g, "\t");

    return value;
  }

  private expandVariables(
    value: string,
    currentVars: Record<string, string>,
  ): string {
    const regex = /\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/g;

    return value.replace(regex, (match, bracedVar, unbracedVar) => {
      const varName = bracedVar || unbracedVar;
      return currentVars[varName] || process.env[varName] || match;
    });
  }

  public get(key: string): string | undefined {
    return process.env[key] || this._envVars[key];
  }

  public getAll(): EnvVars {
    return { ...this._envVars, ...process.env };
  }
}
