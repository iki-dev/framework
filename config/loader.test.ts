import { mkdirSync, rmSync, writeFileSync } from "fs";
import assert from "node:assert";
import { afterEach, beforeEach, test } from "node:test";
import { tmpdir } from "os";
import { join } from "path";
import { ConfigLoader } from "./loader.js";

let tempDir: string;
let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  tempDir = join(tmpdir(), `config-test-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  ConfigLoader.resetInstance();
});

afterEach(() => {
  process.env = originalEnv;
  rmSync(tempDir, { recursive: true, force: true });
});

test("ConfigLoader loads .env file", () => {
  const envContent = `
APP_NAME=Iki
APP_PORT=4649
DATABASE_URL=sqlite:test.db
`;
  writeFileSync(join(tempDir, ".env"), envContent);

  const loader = ConfigLoader.getInstance();
  loader.load(tempDir);

  assert.strictEqual(loader.get("APP_NAME"), "Iki");
  assert.strictEqual(loader.get("APP_PORT"), "4649");
  assert.strictEqual(loader.get("DATABASE_URL"), "sqlite:test.db");
});

test("ConfigLoader handles quotes in values", () => {
  const envContent = `
QUOTED_SINGLE='Hello World'
QUOTED_DOUBLE="Hello World"
WITH_QUOTES="It's a 'test'"
`;
  writeFileSync(join(tempDir, ".env"), envContent);

  const loader = ConfigLoader.getInstance();
  loader.load(tempDir);

  assert.strictEqual(loader.get("QUOTED_SINGLE"), "Hello World");
  assert.strictEqual(loader.get("QUOTED_DOUBLE"), "Hello World");
  assert.strictEqual(loader.get("WITH_QUOTES"), "It's a 'test'");
});

test("ConfigLoader expands variables", () => {
  const envContent = `
HOST=localhost
PORT=5432
DATABASE_URL=$HOST:$PORT
FULL_URL=postgres://\${HOST}:\${PORT}/db
`;
  writeFileSync(join(tempDir, ".env"), envContent);

  const loader = ConfigLoader.getInstance();
  loader.load(tempDir);

  assert.strictEqual(loader.get("DATABASE_URL"), "localhost:5432");
  assert.strictEqual(loader.get("FULL_URL"), "postgres://localhost:5432/db");
});

test("ConfigLoader handles escape sequences", () => {
  const envContent = `
WITH_NEWLINE=Hello\\nWorld
WITH_TAB=Hello\\tWorld
WITH_RETURN=Hello\\rWorld
`;
  writeFileSync(join(tempDir, ".env"), envContent);

  const loader = ConfigLoader.getInstance();
  loader.load(tempDir);

  assert.strictEqual(loader.get("WITH_NEWLINE"), "Hello\nWorld");
  assert.strictEqual(loader.get("WITH_TAB"), "Hello\tWorld");
  assert.strictEqual(loader.get("WITH_RETURN"), "Hello\rWorld");
});

test("ConfigLoader ignores comments and empty lines", () => {
  const envContent = `
# This is a comment
APP_NAME=TestApp

# Another comment
  # Indented comment
DATABASE_URL=sqlite:test.db
`;
  writeFileSync(join(tempDir, ".env"), envContent);

  const loader = ConfigLoader.getInstance();
  loader.load(tempDir);

  assert.strictEqual(loader.get("APP_NAME"), "TestApp");
  assert.strictEqual(loader.get("DATABASE_URL"), "sqlite:test.db");
  assert.strictEqual(loader.get("# This is a comment"), undefined);
});

test("ConfigLoader loads files in correct order", () => {
  writeFileSync(join(tempDir, ".env"), "APP_NAME=Base");
  writeFileSync(join(tempDir, ".env.local"), "APP_NAME=Local");

  process.env.NODE_ENV = "production";
  writeFileSync(join(tempDir, ".env.production"), "APP_NAME=Production");
  writeFileSync(
    join(tempDir, ".env.production.local"),
    "APP_NAME=ProductionLocal",
  );

  const loader = ConfigLoader.getInstance();
  loader.load(tempDir);

  assert.strictEqual(loader.get("APP_NAME"), "ProductionLocal");
});

test("ConfigLoader respects existing process.env values", () => {
  process.env.EXISTING_VAR = "FromProcess";
  writeFileSync(join(tempDir, ".env"), "EXISTING_VAR=FromFile");

  const loader = ConfigLoader.getInstance();
  loader.load(tempDir);

  assert.strictEqual(loader.get("EXISTING_VAR"), "FromProcess");
});

test("ConfigLoader getAll returns all variables", () => {
  const envContent = `
VAR1=value1
VAR2=value2
VAR3=value3
`;
  writeFileSync(join(tempDir, ".env"), envContent);

  const loader = ConfigLoader.getInstance();
  loader.load(tempDir);

  const all = loader.getAll();
  assert.strictEqual(all.VAR1, "value1");
  assert.strictEqual(all.VAR2, "value2");
  assert.strictEqual(all.VAR3, "value3");
});
