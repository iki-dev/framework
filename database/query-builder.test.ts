import { test, describe } from "node:test";
import { strict as assert } from "node:assert";
import { QueryBuilder } from "./query-builder.js";
import { SqliteDriver } from "./drivers/sqlite.js";

describe("QueryBuilder", () => {
  const driver = new SqliteDriver();

  describe("SELECT queries with WHERE clauses", () => {
    test("should generate simple WHERE clause with equals", () => {
      const qb = new QueryBuilder(driver);
      const sql = qb.table("users").select().where("id", "=", 1).toSql();
      const values = qb.values();

      assert.equal(sql, "SELECT * FROM users WHERE id = ?");
      assert.deepEqual(values, [1]);
    });

    test("should generate WHERE clause with different operators", () => {
      const testCases = [
        {
          method: "whereEqual",
          operator: "=",
          expectedSql: "SELECT * FROM users WHERE age = ?",
        },
        {
          method: "whereNotEqual",
          operator: "!=",
          expectedSql: "SELECT * FROM users WHERE age != ?",
        },
        {
          method: "whereGreaterThan",
          operator: ">",
          expectedSql: "SELECT * FROM users WHERE age > ?",
        },
        {
          method: "whereLessThan",
          operator: "<",
          expectedSql: "SELECT * FROM users WHERE age < ?",
        },
        {
          method: "whereGreaterThanOrEqual",
          operator: ">=",
          expectedSql: "SELECT * FROM users WHERE age >= ?",
        },
        {
          method: "whereLessThanOrEqual",
          operator: "<=",
          expectedSql: "SELECT * FROM users WHERE age <= ?",
        },
      ];

      testCases.forEach(({ method, expectedSql }) => {
        const qb = new QueryBuilder(driver);
        let chainedQb;

        switch (method) {
          case "whereEqual":
            chainedQb = qb.table("users").select().whereEqual("age", 25);
            break;
          case "whereNotEqual":
            chainedQb = qb.table("users").select().whereNotEqual("age", 25);
            break;
          case "whereGreaterThan":
            chainedQb = qb.table("users").select().whereGreaterThan("age", 25);
            break;
          case "whereLessThan":
            chainedQb = qb.table("users").select().whereLessThan("age", 25);
            break;
          case "whereGreaterThanOrEqual":
            chainedQb = qb
              .table("users")
              .select()
              .whereGreaterThanOrEqual("age", 25);
            break;
          case "whereLessThanOrEqual":
            chainedQb = qb
              .table("users")
              .select()
              .whereLessThanOrEqual("age", 25);
            break;
          default:
            throw new Error(`Unknown method: ${method}`);
        }

        const sql = chainedQb.toSql();
        const values = chainedQb.values();

        assert.equal(sql, expectedSql);
        assert.deepEqual(values, [25]);
      });
    });

    test("should generate multiple WHERE conditions with AND", () => {
      const qb = new QueryBuilder(driver);
      const sql = qb
        .table("users")
        .select()
        .where("status", "=", "active")
        .where("age", ">", 18)
        .where("city", "=", "London")
        .toSql();
      const values = qb.values();

      assert.equal(
        sql,
        "SELECT * FROM users WHERE status = ? AND age > ? AND city = ?",
      );
      assert.deepEqual(values, ["active", 18, "London"]);
    });

    test("should handle different value types", () => {
      const qb = new QueryBuilder(driver);
      const sql = qb
        .table("products")
        .select()
        .where("name", "=", "iPhone")
        .where("price", ">", 999.99)
        .where("in_stock", "=", true)
        .where("category_id", "=", null)
        .toSql();
      const values = qb.values();

      assert.equal(
        sql,
        "SELECT * FROM products WHERE name = ? AND price > ? AND in_stock = ? AND category_id = ?",
      );
      assert.deepEqual(values, ["iPhone", 999.99, true, null]);
    });

    test("should generate SELECT without WHERE when no conditions", () => {
      const qb = new QueryBuilder(driver);
      const sql = qb.table("users").select().toSql();
      const values = qb.values();

      assert.equal(sql, "SELECT * FROM users");
      assert.deepEqual(values, []);
    });
  });

  describe("INSERT queries", () => {
    test("should generate INSERT query without WHERE clauses", () => {
      const qb = new QueryBuilder(driver);
      const sql = qb
        .table("users")
        .insert({ name: "John", email: "john@example.com" })
        .toSql();
      const values = qb.values();

      assert.equal(sql, "INSERT INTO users (name, email) VALUES (?, ?)");
      assert.deepEqual(values, ["John", "john@example.com"]);
    });
  });

  describe("SQLite driver integration", () => {
    test("should use correct placeholder format for SQLite", () => {
      const driver = new SqliteDriver();
      assert.equal(driver.placeholder(0), "?");
      assert.equal(driver.placeholder(5), "?");
    });

    test("should generate correct placeholders for multiple conditions", () => {
      const qb = new QueryBuilder(driver);
      const sql = qb
        .table("orders")
        .select()
        .where("customer_id", "=", 123)
        .where("status", "!=", "cancelled")
        .where("total", ">=", 50.0)
        .toSql();

      console.log("SQL", sql);
      assert.equal(
        sql,
        "SELECT * FROM orders WHERE customer_id = ? AND status != ? AND total >= ?",
      );
    });
  });

  describe("Error handling", () => {
    test("should throw error when table name is missing", () => {
      const qb = new QueryBuilder(driver);
      assert.throws(() => qb.select().toSql(), /Table name is required/);
    });

    test("should throw error when insert data is missing for INSERT", () => {
      const qb = new QueryBuilder(driver);
      assert.throws(() => qb.table("users").toSql(), /Insert data is required/);
    });
  });
});
