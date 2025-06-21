export class ConfigParser {
  public static pathToEnvKey(path: string): string {
    return path
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/\./g, "_")
      .replace(/[^A-Z0-9_]/g, "");
  }

  public static parseValue(
    value: string,
    type?: "string" | "number" | "boolean",
  ): string | number | boolean {
    if (!type || type === "string") {
      return value;
    }

    if (type === "number") {
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Cannot parse "${value}" as number`);
      }
      return num;
    }

    if (type === "boolean") {
      const lowerValue = value.toLowerCase();
      if (
        lowerValue === "true" ||
        lowerValue === "1" ||
        lowerValue === "yes" ||
        lowerValue === "on"
      ) {
        return true;
      }
      if (
        lowerValue === "false" ||
        lowerValue === "0" ||
        lowerValue === "no" ||
        lowerValue === "off"
      ) {
        return false;
      }
      throw new Error(`Cannot parse "${value}" as boolean`);
    }

    return value;
  }

  public static validatePath(path: string): void {
    if (!path || typeof path !== "string") {
      throw new Error("Config path must be a non-empty string");
    }

    if (path.startsWith(".") || path.endsWith(".")) {
      throw new Error("Config path cannot start or end with a dot");
    }

    if (path.includes("..")) {
      throw new Error("Config path cannot contain consecutive dots");
    }
  }
}
