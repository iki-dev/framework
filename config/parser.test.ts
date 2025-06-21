import { test } from "node:test";
import assert from "node:assert";
import { ConfigParser } from "./parser.js";

test("ConfigParser.pathToEnvKey converts dot notation to env key", () => {
  assert.strictEqual(
    ConfigParser.pathToEnvKey("database.host"),
    "DATABASE_HOST",
  );
  assert.strictEqual(ConfigParser.pathToEnvKey("app.name"), "APP_NAME");
  assert.strictEqual(
    ConfigParser.pathToEnvKey("redis.connection.url"),
    "REDIS_CONNECTION_URL",
  );
  assert.strictEqual(
    ConfigParser.pathToEnvKey("services.stripe.key"),
    "SERVICES_STRIPE_KEY",
  );
});

test("ConfigParser.pathToEnvKey handles special characters", () => {
  assert.strictEqual(ConfigParser.pathToEnvKey("app-name"), "APPNAME");
  assert.strictEqual(ConfigParser.pathToEnvKey("app name"), "APP_NAME");
  assert.strictEqual(ConfigParser.pathToEnvKey("app@name"), "APPNAME");
});

test("ConfigParser.parseValue handles string type", () => {
  assert.strictEqual(ConfigParser.parseValue("hello", "string"), "hello");
  assert.strictEqual(ConfigParser.parseValue("123", "string"), "123");
  assert.strictEqual(ConfigParser.parseValue("true", "string"), "true");
});

// These tests are now handled by the ConfigManager's type inference

test("ConfigParser.validatePath validates correct paths", () => {
  assert.doesNotThrow(() => ConfigParser.validatePath("app.name"));
  assert.doesNotThrow(() => ConfigParser.validatePath("database.host"));
  assert.doesNotThrow(() => ConfigParser.validatePath("redis.connection.url"));
});

test("ConfigParser.validatePath throws on invalid paths", () => {
  assert.throws(
    () => ConfigParser.validatePath(""),
    /Config path must be a non-empty string/,
  );
  assert.throws(
    () => ConfigParser.validatePath(".app"),
    /Config path cannot start or end with a dot/,
  );
  assert.throws(
    () => ConfigParser.validatePath("app."),
    /Config path cannot start or end with a dot/,
  );
  assert.throws(
    () => ConfigParser.validatePath("app..name"),
    /Config path cannot contain consecutive dots/,
  );
  assert.throws(
    () => ConfigParser.validatePath(null as unknown as string),
    /Config path must be a non-empty string/,
  );
});
