import { DatabaseDriver } from "./drivers/index.js";
import {
  QueryValue,
  QueryParams,
  QueryResult,
  UnknownRecord,
} from "../types/common.js";

export class QueryBuilder {
  private tableName: string | null = null;
  private insertData: UnknownRecord | null = null;
  private isSelectQuery: boolean = false;
  private whereConditions: Array<{
    column: string;
    operator: string;
    value: QueryValue;
  }> = [];

  constructor(private readonly driver: DatabaseDriver) {}

  /**
   * Sets the table name for the query.
   *
   * @param name
   * @return this
   */
  public table(name: string): this {
    this.tableName = name;
    return this;
  }

  /**
   * Inserts data into the table.
   *
   * @param data
   * @return this
   */
  public insert(data: UnknownRecord): this {
    this.insertData = data;
    this.isSelectQuery = false;
    return this;
  }

  /**
   * Selects data from the table.
   *
   * @return this
   */
  public select(): this {
    this.isSelectQuery = true;
    return this;
  }

  /**
   * Adds a WHERE condition to the query.
   *
   * @param column The column to filter on.
   * @param operator The operator to use for comparison (e.g., '=', '!=', '>', '<', '>=', '<=').
   * @param value The value to compare against.
   * @return this
   */
  public where(column: string, operator: string, value: QueryValue): this {
    this.whereConditions.push({ column, operator, value });
    return this;
  }

  /**
   * Adds a WHERE condition with an AND operator.
   *
   * @param column The column to filter on.
   * @param value The value to compare against.
   * @return this
   */
  public whereEqual(column: string, value: QueryValue): this {
    return this.where(column, "=", value);
  }

  /**
   * Adds a WHERE condition with an NOT EQUAL operator.
   *
   * @param column The column to filter on.
   * @param value The value to compare against.
   * @return this
   */
  public whereNotEqual(column: string, value: QueryValue): this {
    return this.where(column, "!=", value);
  }

  /**
   * Adds a WHERE condition with a Greater THAN operator.
   *
   * @param column The column to filter on.
   * @param value The value to compare against.
   * @return this
   */
  public whereGreaterThan(column: string, value: QueryValue): this {
    return this.where(column, ">", value);
  }

  /**
   * Adds a WHERE condition with a Less THAN operator.
   *
   * @param column The column to filter on.
   * @param value The value to compare against.
   * @return this
   */
  public whereLessThan(column: string, value: QueryValue): this {
    return this.where(column, "<", value);
  }

  /**
   * Adds a WHERE condition with a Greater THAN OR EQUAL operator.
   *
   * @param column The column to filter on.
   * @param value The value to compare against.
   * @return this
   */
  public whereGreaterThanOrEqual(column: string, value: QueryValue): this {
    return this.where(column, ">=", value);
  }

  /**
   * Adds a WHERE condition with a Less THAN OR EQUAL operator.
   *
   * @param column The column to filter on.
   * @param value The value to compare against.
   * @return this
   */
  public whereLessThanOrEqual(column: string, value: QueryValue): this {
    return this.where(column, "<=", value);
  }

  /**
   * Executes the query and returns the result.
   *
   * @return Promise<any> TODO: define a more specific return type
   */
  public async execute(): Promise<
    QueryResult[] | { insertId: string | number }
  > {
    if (!this.tableName) {
      throw new Error("Table name is required");
    }

    if (this.isSelectQuery) {
      return await this.driver.select(this.toSql(), this.values());
    } else {
      return await this.driver.insert(this.toSql(), this.values());
    }
  }

  /**
   * Converts the query to SQL string.
   *
   * @return string
   */
  public toSql(): string {
    if (!this.tableName) {
      throw new Error("Table name is required to generate SQL");
    }
    const parts = [];

    // TODO: Break select and insert SQL generation into separate methods for better readability
    if (this.isSelectQuery) {
      parts.push("SELECT");
      parts.push(`*`);
      parts.push(`FROM`);
      parts.push(this.tableName);

      if (this.whereConditions.length > 0) {
        parts.push(`WHERE`);

        const whereConditions: string[] = [];
        this.whereConditions.map((_, index) =>
          whereConditions.push(
            `${this.whereConditions[index].column} ${this.whereConditions[index].operator} ${this.driver.placeholder(index)}`,
          ),
        );
        parts.push(whereConditions.join(" AND "));
      }

      return parts.join(" ");
    }

    if (!this.insertData) {
      throw new Error("Insert data is required to generate INSERT SQL");
    }

    const columns = Object.keys(this.insertData);
    const placeholders = columns.map((_, index) =>
      this.driver.placeholder(index),
    );

    parts.push("INSERT INTO");
    parts.push(this.tableName);
    parts.push(`(${columns.join(", ")})`);
    parts.push("VALUES");
    parts.push(`(${placeholders.join(", ")})`);

    return parts.join(" ");
  }

  /**
   * Returns the values to be used in the query.
   *
   * @return any[] The values to be used in the query.
   */
  public values(): QueryParams {
    const values: QueryParams = [];

    if (this.insertData) {
      values.push(...(Object.values(this.insertData) as QueryValue[]));
    }

    if (this.isSelectQuery && this.whereConditions.length > 0) {
      values.push(...this.whereConditions.map((condition) => condition.value));
    }

    return values;
  }
}
