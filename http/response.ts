import { ContentType, HttpStatusCode } from "./http.js";
import { ValidationError } from "../validation/index.js";

export type ResponseHeaders = Record<string, string | string[]>;

export class Response {
  private _headers: ResponseHeaders = {};
  private _body: unknown;
  private _sent: boolean = false;

  constructor(public statusCode: HttpStatusCode) {}

  private normalizeHeaderKey(key: string): string {
    return key.toLowerCase();
  }

  public get headers(): ResponseHeaders {
    return { ...this._headers };
  }

  public get body(): unknown {
    return this._body;
  }

  public setHeader(name: string, value: string | string[]): this {
    this._headers[this.normalizeHeaderKey(name)] = value;
    return this;
  }

  public header(name: string): string | string[] | undefined {
    return this._headers[this.normalizeHeaderKey(name)];
  }

  public hasHeader(name: string): boolean {
    return this.normalizeHeaderKey(name) in this._headers;
  }

  public status(code: HttpStatusCode): this {
    this.statusCode = code;
    return this;
  }

  public send(body: unknown): this {
    this._body = body;
    return this;
  }

  public json(data: unknown): this {
    this.setHeader("content-type", ContentType.ApplicationJSON);
    this._body = JSON.stringify(data);
    return this;
  }

  public contentType(): string | undefined {
    const contentType = this.header("content-type");
    if (Array.isArray(contentType)) {
      return contentType[0];
    }
    return contentType;
  }

  /**
   * Send a validation error response
   *
   * @param errors Array of validation errors
   * @returns this for method chaining
   */
  public validationError(errors: ValidationError[]): this {
    return this.status(422).json({
      error: "Validation failed",
      details: errors,
    });
  }

  public get sent(): boolean {
    return this._sent;
  }

  public markSent(): void {
    this._sent = true;
  }
}

export const response = (status: HttpStatusCode) => new Response(status);
