import { Request } from "./request.js";
import { Response } from "./response.js";

export type Handler = (request: Request) => Promise<Response>;
export type HandlerFunc = () => Handler;
