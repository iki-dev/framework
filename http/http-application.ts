import { HttpServer } from "./server.js";
import { HttpKernel } from "./kernel.js";
import { Router } from "./router.js";
import { Middleware } from "./middleware.js";

export interface HttpAppConfig {
  env?: string;
}

export class HttpApplication {
  private httpKernel: HttpKernel;
  private httpServer?: HttpServer;
  private _config: HttpAppConfig;

  constructor(config: HttpAppConfig = {}) {
    this._config = {
      env: config.env || process.env.NODE_ENV || "development",
    };
    this.httpKernel = new HttpKernel();
  }

  public use(middleware: Middleware): this {
    this.httpKernel.use(middleware);
    return this;
  }

  public mount(path: string, router: Router): this {
    this.httpKernel.mount(path, router);
    return this;
  }

  public useRouter(router: Router): this {
    return this.mount("/", router);
  }

  public listen(port: number, callback?: () => void): void {
    this.httpServer = new HttpServer(this.httpKernel);
    this.httpServer.listen(port, callback);
  }

  public async close(): Promise<void> {
    if (this.httpServer) {
      this.httpServer.close();
    }
  }

  public config(): HttpAppConfig {
    return { ...this._config };
  }
}
