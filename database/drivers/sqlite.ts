import Database from "better-sqlite3";
import { DatabaseDriver } from "./index.js";
import { QueryParams, QueryResult } from "../../types/common.js";

export class SqliteDriver implements DatabaseDriver {
  constructor(
    private readonly driver: Database.Database = new Database("default.db"),
  ) {}

  // TODO: Wondering whether to drop the index parameter...
  public placeholder(): string {
    return "?";
  }

  public insert(
    sql: string,
    params: QueryParams,
  ): Promise<{ insertId: number | string }> {
    const stmt = this.driver.prepare(sql);
    const result = stmt.run(...params);
    return Promise.resolve({ insertId: Number(result.lastInsertRowid) });
  }

  public select(sql: string, params: QueryParams): Promise<QueryResult[]> {
    const stmt = this.driver.prepare(sql);
    const results = stmt.all(...params);
    return Promise.resolve(results);
  }
}
