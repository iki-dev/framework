import { UnknownRecord } from "../types/common.js";

/**
 * Simple input sanitiser for RESTful APIs
 * Provides basic XSS and SQL injection protection
 */
export class ApiSanitiser {
  /**
   * Sanitise a value for safe use in HTML context
   */
  public static sanitiseValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === "string") {
      return this.sanitiseString(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitiseValue(item));
    }

    if (typeof value === "object") {
      const sanitised: UnknownRecord = {};
      for (const [key, val] of Object.entries(value)) {
        sanitised[key] = this.sanitiseValue(val);
      }
      return sanitised;
    }

    return value;
  }

  /**
   * Sanitise a string value
   */
  private static sanitiseString(str: string): string {
    return (
      str
        // HTML entity escaping for XSS protection
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;")
        // Basic SQL injection protection
        .replace(/'/g, "''") // Escape single quotes for SQL
        // Remove null bytes and other dangerous characters
        .replace(/\0/g, "")
        .replace(/\x08/g, "")
        .replace(/\x09/g, "")
        .replace(/\x1a/g, "")
    );
  }

  /**
   * Sanitise object properties recursively
   */
  public static sanitiseObject(obj: unknown): unknown {
    if (!obj || typeof obj !== "object") {
      return this.sanitiseValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitiseObject(item));
    }

    const sanitised: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitised[key] = this.sanitiseObject(value);
    }
    return sanitised;
  }
}
