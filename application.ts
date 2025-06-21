import { HttpApplication, HttpAppConfig } from "./http/http-application.js";
import { loadConfig } from "./config/index.js";

export interface ApplicationConfig {
  env?: string;
  configPath?: string;
}

export class Application {
  private _config: ApplicationConfig;

  constructor(config: ApplicationConfig = {}) {
    loadConfig(config.configPath);

    this._config = {
      env: config.env || process.env.NODE_ENV || "development",
    };
  }

  public http(config?: HttpAppConfig): HttpApplication {
    const httpConfig = {
      ...this._config,
      ...config,
    };
    return new HttpApplication(httpConfig);
  }

  public config(): ApplicationConfig {
    return { ...this._config };
  }
}
