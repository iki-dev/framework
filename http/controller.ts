import { Request } from "./request.js";
import { Response } from "./response.js";

export abstract class Controller {}

export type Handler = (request: Request) => Promise<Response>;

// Type helper to extract method names that match Handler signature
export type ControllerMethod<T extends Controller> = {
  [K in keyof T]: T[K] extends Handler ? K : never;
}[keyof T];
