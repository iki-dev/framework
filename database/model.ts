import { QueryBuilder } from "./query-builder.js";
import { DatabaseManager } from "./manager.js";
import { UnknownRecord, QueryResult } from "../types/common.js";

// Filtered properties are those that should not be saved to the database, usually they'll
// be used internally by the model or are not relevant for persistence.
const FILTERED_PROPERTIES = ["queryBuilder", "primaryKey"];

export abstract class Model {
  protected primaryKey: string = "id";
  private queryBuilder: QueryBuilder;

  protected constructor() {
    this.queryBuilder = new QueryBuilder(DatabaseManager.driver());
  }

  /**
   * @return A QueryBuilder instance for the model.
   */
  public static queryBuilder<T extends Model>(
    this: new (...args: unknown[]) => T,
  ): QueryBuilder {
    return new QueryBuilder(DatabaseManager.driver()).table(
      this.name.toLowerCase(),
    );
  }

  /**
   * Retrieve all instances of the model from the database.
   *
   * @return A promise that resolves to an array of model instances.
   */
  public static async all<T extends Model>(
    this: new (...args: unknown[]) => T,
  ): Promise<T[]> {
    const qb = new QueryBuilder(DatabaseManager.driver())
      .table(this.name.toLowerCase())
      .select();

    const results = (await qb.execute()) as QueryResult[];

    return results.map((result: UnknownRecord) => {
      const instance = new this();
      Object.assign(instance, result);
      return instance;
    });
  }

  /**
   * Find a model instance by a specific value in a column.
   *
   * @param value The value to search for in the specified column.
   * @param column The column to search in, defaults to 'id'.
   *
   * @return A promise that resolves to the model instance if found, or null if not found.
   */
  public static async findBy<T extends Model>(
    this: new (...args: unknown[]) => T,
    value: string | number | undefined,
    column: string = "id",
  ): Promise<T | null> {
    if (value === undefined) {
      return null;
    }

    const qb = new QueryBuilder(DatabaseManager.driver())
      .table(this.name.toLowerCase())
      .select()
      .where(column, "=", value);

    const results = (await qb.execute()) as QueryResult[];

    if (results.length === 0) {
      return null;
    }

    const instance = new this();
    Object.assign(instance, results[0]);
    return instance;
  }

  /**
   * Retrieves the properties of the model instance, excluding filtered properties,
   * which are not meant to be saved to the database.
   */
  private getProperties(): UnknownRecord {
    const excludedKeys = [...FILTERED_PROPERTIES, this.primaryKey];
    const properties: UnknownRecord = {};

    for (const key of Object.keys(this)) {
      if (excludedKeys.includes(key)) {
        continue;
      }

      properties[key] = (this as UnknownRecord)[key];
    }

    return properties;
  }

  /**
   * Saves the current model instance to the database.
   *
   * The primary key is automatically set after the insert operation.
   */
  public async save(): Promise<void> {
    const qb = this.queryBuilder
      .table(this.constructor.name.toLowerCase())
      .insert(this.getProperties());

    const result = await qb.execute();

    if ("insertId" in result) {
      (this as UnknownRecord)[this.primaryKey] = result.insertId;
    }

    return Promise.resolve();
  }

  /**
   * Converts the model instance to a JSON object.
   *
   * @return A JSON representation of the model instance.
   */
  public toJSON(): UnknownRecord {
    const json: UnknownRecord = {};
    for (const key of Object.keys(this)) {
      if (!FILTERED_PROPERTIES.includes(key)) {
        json[key] = (this as UnknownRecord)[key];
      }
    }
    return json;
  }
}
