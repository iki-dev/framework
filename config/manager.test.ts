import { mkdirSync, rmSync, writeFileSync } from "fs";
import assert from "node:assert";
import { afterEach, beforeEach, test } from "node:test";
import { tmpdir } from "os";
import { join } from "path";
import { ConfigLoader } from "./loader.js";
import { ConfigManager } from "./manager.js";

let tempDir: string;
let originalEnv: NodeJS.ProcessEnv;
let manager: ConfigManager;

beforeEach(() => {
  originalEnv = { ...process.env };
  tempDir = join(tmpdir(), `config-manager-test-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  ConfigLoader.resetInstance();
  manager = ConfigManager.getInstance();
});

afterEach(() => {
  process.env = originalEnv;
  rmSync(tempDir, { recursive: true, force: true });
});

test("ConfigManager infers string type from default value", () => {
  const envContent = `APP_NAME=TestApp`;
  writeFileSync(join(tempDir, ".env"), envContent);

  manager.load(tempDir);

  const result = manager.get("app.name", "Default App");
  assert.strictEqual(result, "TestApp");
  assert.strictEqual(typeof result, "string");
});

test("ConfigManager infers number type from default value", () => {
  const envContent = `APP_PORT=4649`;
  writeFileSync(join(tempDir, ".env"), envContent);

  manager.load(tempDir);

  const result = manager.get("app.port", 8080);
  assert.strictEqual(result, 4649);
  assert.strictEqual(typeof result, "number");
});

test("ConfigManager infers boolean type from default value", () => {
  const envContent = `APP_DEBUG=true`;
  writeFileSync(join(tempDir, ".env"), envContent);

  manager.load(tempDir);

  const result = manager.get("app.debug", false);
  assert.strictEqual(result, true);
  assert.strictEqual(typeof result, "boolean");
});

test("ConfigManager handles boolean variations", () => {
  const envContent = `
DEBUG_TRUE=true
DEBUG_FALSE=false
DEBUG_ONE=1
DEBUG_ZERO=0
DEBUG_YES=yes
DEBUG_NO=no
DEBUG_ON=on
DEBUG_OFF=off
`;
  writeFileSync(join(tempDir, ".env"), envContent);

  manager.load(tempDir);

  assert.strictEqual(manager.get("debug.true", false), true);
  assert.strictEqual(manager.get("debug.false", true), false);
  assert.strictEqual(manager.get("debug.one", false), true);
  assert.strictEqual(manager.get("debug.zero", true), false);
  assert.strictEqual(manager.get("debug.yes", false), true);
  assert.strictEqual(manager.get("debug.no", true), false);
  assert.strictEqual(manager.get("debug.on", false), true);
  assert.strictEqual(manager.get("debug.off", true), false);
});

test("ConfigManager returns default value when env var not found", () => {
  manager.load(tempDir);

  assert.strictEqual(manager.get("missing.string", "default"), "default");
  assert.strictEqual(manager.get("missing.number", 42), 42);
  assert.strictEqual(manager.get("missing.boolean", true), true);
});

test("ConfigManager throws on invalid number conversion", () => {
  const envContent = `INVALID_NUMBER=hello`;
  writeFileSync(join(tempDir, ".env"), envContent);

  manager.load(tempDir);

  assert.throws(
    () => manager.get("invalid.number", 42),
    /Cannot parse "hello" as number/,
  );
});

test("ConfigManager throws on invalid boolean conversion", () => {
  const envContent = `INVALID_BOOLEAN=maybe`;
  writeFileSync(join(tempDir, ".env"), envContent);

  manager.load(tempDir);

  assert.throws(
    () => manager.get("invalid.boolean", false),
    /Cannot parse "maybe" as boolean/,
  );
});

test("ConfigManager caches parsed values", () => {
  const envContent = `APP_PORT=4649`;
  writeFileSync(join(tempDir, ".env"), envContent);

  manager.load(tempDir);

  const result1 = manager.get("app.port", 8080);
  const result2 = manager.get("app.port", 8080);

  assert.strictEqual(result1, result2);
  assert.strictEqual(result1, 4649);
});
