import { HttpMethod } from "./http.js";
import { Handler } from "./controller.js";
import { Middleware } from "./middleware.js";

export type Route = {
  method: HttpMethod;
  path: string;
  handler: Handler;
  middleware: Middleware[];
};
