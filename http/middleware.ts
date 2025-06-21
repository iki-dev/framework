import { Request } from "./request.js";
import { Response } from "./response.js";

export type NextFunction = () => Promise<void>;

export abstract class Middleware {
  public abstract handle(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void>;
}
