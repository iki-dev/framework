import { ConfigManager } from "./manager.js";
import { ConfigValue } from "../types/common.js";

export { ConfigManager } from "./manager.js";
export { ConfigLoader, EnvVars } from "./loader.js";
export { ConfigParser } from "./parser.js";

const manager = ConfigManager.getInstance();

export function config<T = string>(path: string, defaultValue?: T): T {
  return manager.get(path, defaultValue);
}

export function loadConfig(baseDir?: string): void {
  manager.load(baseDir);
}

export function hasConfig(path: string): boolean {
  return manager.has(path);
}

export function setConfig(path: string, value: ConfigValue): void {
  manager.set(path, value);
}

export function allConfig(): Record<string, string> {
  return manager.all();
}
