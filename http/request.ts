import { HttpMethod } from "./http.js";
import { UploadedFile } from "./uploaded-file.js";
import { UnknownRecord } from "../types/common.js";

export type RequestHeaders = Record<string, string | string[]>;
export type QueryParams = Record<string, string | string[]>;

export class Request {
  private _headers: RequestHeaders = {};
  private _query: QueryParams = {};
  private _rawQuery: QueryParams = {};
  private _rawBody: unknown;
  private _files: Record<string, UploadedFile | UploadedFile[]> = {};

  constructor(
    public readonly method: HttpMethod,
    public readonly url: string,
    headers: RequestHeaders = {},
    public readonly body?: unknown,
    query: QueryParams = {},
    private routeParameters: Record<string, string> = {},
    files: Record<string, UploadedFile | UploadedFile[]> = {},
  ) {
    this.setHeaders(headers);
    this.setQuery(query);
    // Store original data for unsafe access
    this._rawQuery = { ...query };
    this._rawBody = body;
    this._files = files;
  }

  private normalizeHeaderKey(key: string): string {
    return key.toLowerCase();
  }

  private setHeaders(headers: RequestHeaders): void {
    this._headers = {};
    for (const [key, value] of Object.entries(headers)) {
      this._headers[this.normalizeHeaderKey(key)] = value;
    }
  }

  private setQuery(query: QueryParams): void {
    this._query = { ...query };
  }

  public get headers(): RequestHeaders {
    return { ...this._headers };
  }

  public get allQuery(): QueryParams {
    return { ...this._query };
  }

  /**
   * Get all raw unsanitised query parameters.
   * WARNING: This returns potentially dangerous user input. Only use for debugging/logging.
   */
  public get unsafeAllQuery(): QueryParams {
    return { ...this._rawQuery };
  }

  /**
   * Get a header value by name.
   *
   * @param name The name of the header to retrieve.
   * @return The value of the header, which can be a string or an array of strings, or undefined if the header does not exist.
   */
  public header(name: string): string | string[] | undefined {
    return this._headers[this.normalizeHeaderKey(name)];
  }

  /**
   * Check if a header exists.
   *
   * @param name The name of the header to check.
   * @return True if the header exists, false otherwise.
   */
  public hasHeader(name: string): boolean {
    return this.normalizeHeaderKey(name) in this._headers;
  }

  /**
   * Get a sanitised query parameter value by name.
   *
   * @param name The name of the query parameter to retrieve.
   * @return The sanitised value of the query parameter, which can be a string or an array of strings, or undefined if the parameter does not exist.
   */
  public query(name: string): string | string[] | undefined {
    return this._query[name];
  }

  /**
   * Get an unsanitised query parameter value by name.
   * WARNING: This returns potentially dangerous user input. Only use for debugging/logging.
   *
   * @param name The name of the query parameter to retrieve.
   * @return The raw unsanitised value of the query parameter, or undefined if the parameter does not exist.
   */
  public unsafeQuery(name: string): string | string[] | undefined {
    return this._rawQuery[name];
  }

  /**
   * Check if a query parameter exists.
   *
   * @param name The name of the query parameter to check.
   * @return True if the query parameter exists, false otherwise.
   */
  public hasQuery(name: string): boolean {
    return name in this._query;
  }

  /**
   * Get a route parameter value by name.
   *
   * @param name The name of the route parameter to retrieve.
   * @return The value of the route parameter, or undefined if the parameter does not exist.
   */
  public routeParameter(name: string): string | undefined {
    return this.routeParameters[name];
  }

  /**
   * Check if a route parameter exists.
   *
   * @param name The name of the route parameter to check.
   * @return True if the route parameter exists, false otherwise.
   */
  public hasRouteParameter(name: string): boolean {
    return name in this.routeParameters;
  }

  /**
   * Get a sanitised value from the request, checking query parameters first, then body, and returning a fallback if not found.
   *
   * @param key The key to retrieve from the request.
   * @param fallback The value to return if the key is not found in either query or body.
   * @return The sanitised value associated with the key, or the fallback value if not found.
   */
  public get(key: string, fallback?: unknown): unknown {
    if (key in this._query) {
      return this._query[key];
    }

    if (this.body && typeof this.body === "object" && key in this.body) {
      return (this.body as Record<string, unknown>)[key];
    }

    return fallback;
  }

  /**
   * Get an unsanitised value from the request, checking raw query parameters first, then raw body.
   * WARNING: This returns potentially dangerous user input. Only use for debugging/logging.
   *
   * @param key The key to retrieve from the raw request data.
   * @param fallback The value to return if the key is not found.
   * @return The raw unsanitised value associated with the key, or the fallback value if not found.
   */
  public unsafeGet(key: string, fallback?: unknown): unknown {
    if (key in this._rawQuery) {
      return this._rawQuery[key];
    }

    if (
      this._rawBody &&
      typeof this._rawBody === "object" &&
      key in this._rawBody
    ) {
      return (this._rawBody as Record<string, unknown>)[key];
    }

    return fallback;
  }

  /**
   * Check if a key exists in either query parameters or body.
   *
   * @param key The key to check for existence.
   * @return True if the key exists in either query or body, false otherwise.
   */
  public has(key: string): boolean {
    if (key in this._query) {
      return true;
    }

    if (this.body && typeof this.body === "object" && key in this.body) {
      return true;
    }

    return false;
  }

  /**
   * Get all uploaded files.
   *
   * @return A record of uploaded files indexed by field name.
   */
  public get allFiles(): Record<string, UploadedFile | UploadedFile[]> {
    return { ...this._files };
  }

  /**
   * Get an uploaded file by field name.
   *
   * @param name The field name of the file.
   * @return The uploaded file, array of files, or undefined if not found.
   */
  public file(name: string): UploadedFile | UploadedFile[] | undefined {
    return this._files[name];
  }

  /**
   * Get a single uploaded file by field name.
   *
   * @param name The field name of the file.
   * @return The first uploaded file or undefined if not found.
   */
  public singleFile(name: string): UploadedFile | undefined {
    const file = this._files[name];
    if (Array.isArray(file)) {
      return file[0];
    }
    return file;
  }

  /**
   * Get multiple uploaded files by field name.
   *
   * @param name The field name of the files.
   * @return An array of uploaded files or empty array if not found.
   */
  public files(name: string): UploadedFile[] {
    const file = this._files[name];
    if (!file) return [];
    return Array.isArray(file) ? file : [file];
  }

  /**
   * Check if a file was uploaded for the given field name.
   *
   * @param name The field name to check.
   * @return True if a file exists for the field name, false otherwise.
   */
  public hasFile(name: string): boolean {
    return name in this._files;
  }

  /**
   * Get all uploaded files as a flat array.
   *
   * @return An array of all uploaded files.
   */
  public getAllFiles(): UploadedFile[] {
    const allFiles: UploadedFile[] = [];
    for (const file of Object.values(this._files)) {
      if (Array.isArray(file)) {
        allFiles.push(...file);
      } else {
        allFiles.push(file);
      }
    }
    return allFiles;
  }

  /**
   * Get the raw unsanitised body data.
   * WARNING: This returns potentially dangerous user input. Only use for debugging/logging.
   */
  public get unsafeBody(): unknown {
    return this._rawBody;
  }

  /**
   * Check if the request data has been sanitised.
   *
   * @return True if sanitisation was performed.
   */
  public isSanitised(): boolean {
    const metadata = (this as UnknownRecord).sanitisation;
    return Boolean(metadata && (metadata as { sanitised?: boolean }).sanitised);
  }

  /**
   * Check if potentially dangerous content was detected and sanitised.
   *
   * @return True if dangerous content was detected.
   */
  public hasDangerousContent(): boolean {
    const metadata = (this as UnknownRecord).sanitisation;
    return Boolean(metadata && (metadata as { dangerous?: boolean }).dangerous);
  }
}
