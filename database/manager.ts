import { SqliteDriver, DatabaseDriver } from "./drivers/index.js";

export class DatabaseManager {
  private static _driver: DatabaseDriver;

  public static configure(driver: DatabaseDriver) {
    this._driver = driver;
  }

  public static driver(): DatabaseDriver {
    return this._driver;
  }
}

DatabaseManager.configure(new SqliteDriver());
