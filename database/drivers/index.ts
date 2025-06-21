import { QueryParams, QueryResult } from "../../types/common.js";

// Database driver interface
export interface DatabaseDriver {
  placeholder(index: number): string;
  insert(
    sql: string,
    params: QueryParams,
  ): Promise<{ insertId: string | number }>;
  select(sql: string, params: QueryParams): Promise<QueryResult[]>;
}

// SQLite implementation
export { SqliteDriver } from "./sqlite.js";
