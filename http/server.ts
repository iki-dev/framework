import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { parse } from "node:url";
import { Readable } from "node:stream";
import { HttpKernel } from "./kernel.js";
import { Request, RequestHeaders } from "./request.js";
import { HttpMethod } from "./http.js";
import { MultipartParser } from "./parsers/multipart-parser.js";
import { UploadedFile } from "./uploaded-file.js";

export class HttpServer {
  private server = createServer((req, res) => this.handleRequest(req, res));

  constructor(private kernel: HttpKernel) {}

  private parseHeaders(req: IncomingMessage): RequestHeaders {
    const headers: RequestHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        headers[key] = value;
      }
    }
    return headers;
  }

  private parseQuery(url: string): Record<string, string | string[]> {
    const parsed = parse(url, true);
    const query: Record<string, string | string[]> = {};

    if (parsed.query) {
      for (const [key, value] of Object.entries(parsed.query)) {
        if (value !== undefined) {
          query[key] = value;
        }
      }
    }

    return query;
  }

  private async parseBody(req: IncomingMessage): Promise<{
    body: unknown;
    files: Record<string, UploadedFile | UploadedFile[]>;
  }> {
    const contentType = req.headers["content-type"] || "";

    // Handle multipart/form-data
    if (contentType.includes("multipart/form-data")) {
      try {
        const parser = new MultipartParser(contentType);
        const result = await parser.parse(req as Readable);

        // Convert parsed files to UploadedFile instances
        const uploadedFiles: Record<string, UploadedFile | UploadedFile[]> = {};
        for (const [fieldName, file] of Object.entries(result.files)) {
          if (Array.isArray(file)) {
            uploadedFiles[fieldName] = file.map(
              (f) =>
                new UploadedFile(
                  f.fieldName,
                  f.filename,
                  f.mimetype,
                  f.size,
                  f.tempPath,
                ),
            );
          } else {
            uploadedFiles[fieldName] = new UploadedFile(
              file.fieldName,
              file.filename,
              file.mimetype,
              file.size,
              file.tempPath,
            );
          }
        }

        return { body: result.fields, files: uploadedFiles };
      } catch (error) {
        throw new Error(`Failed to parse multipart data: ${error}`);
      }
    }

    // Handle other content types
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        if (!body) {
          resolve({ body: undefined, files: {} });
          return;
        }

        try {
          if (contentType.includes("application/json")) {
            resolve({ body: JSON.parse(body), files: {} });
          } else {
            resolve({ body, files: {} });
          }
        } catch (error) {
          reject(error);
        }
      });
      req.on("error", reject);
    });
  }

  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      const method = req.method as HttpMethod;
      const url = req.url || "/";
      const headers = this.parseHeaders(req);
      const query = this.parseQuery(url);
      const { body, files } = await this.parseBody(req);

      const request = new Request(method, url, headers, body, query, {}, files);
      const response = await this.kernel.handle(request);

      // Apply response to Node.js ServerResponse
      res.statusCode = response.statusCode;

      // Set headers from Response
      for (const [key, value] of Object.entries(response.headers)) {
        if (Array.isArray(value)) {
          res.setHeader(key, value);
        } else {
          res.setHeader(key, value);
        }
      }

      // Send body
      if (response.body !== undefined) {
        res.end(response.body);
      } else {
        res.end();
      }
    } catch (error) {
      console.error("Error handling request:", error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain");
      res.end("Internal Server Error");
    }
  }

  public listen(port: number, callback?: () => void): void {
    this.server.listen(port, callback);
  }

  public close(): void {
    this.server.close();
  }
}
