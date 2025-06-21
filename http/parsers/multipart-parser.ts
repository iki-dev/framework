import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";

export interface ParsedField {
  name: string;
  value: string;
}

export interface ParsedFile {
  fieldName: string;
  filename: string;
  mimetype: string;
  size: number;
  tempPath: string;
}

export interface MultipartParseResult {
  fields: Record<string, string | string[]>;
  files: Record<string, ParsedFile | ParsedFile[]>;
}

export interface MultipartParserOptions {
  maxFileSize?: number;
  maxFieldSize?: number;
  maxFiles?: number;
  uploadDir?: string;
}

export class MultipartParser {
  private readonly boundaryBuffer: Buffer;
  private readonly options: Required<MultipartParserOptions>;

  constructor(contentType: string, options: MultipartParserOptions = {}) {
    const boundary = this.extractBoundary(contentType);
    if (!boundary) {
      throw new Error("Invalid multipart content-type: missing boundary");
    }

    this.boundaryBuffer = Buffer.from(`--${boundary}`);

    this.options = {
      maxFileSize: options.maxFileSize ?? 10 * 1024 * 1024, // 10MB default
      maxFieldSize: options.maxFieldSize ?? 1 * 1024 * 1024, // 1MB default
      maxFiles: options.maxFiles ?? 10,
      uploadDir: options.uploadDir ?? tmpdir(),
    };
  }

  private extractBoundary(contentType: string): string | null {
    const match = contentType.match(/boundary=([^;]+)/);
    if (!match) return null;

    let boundary = match[1].trim();
    // Remove quotes if present
    if (boundary.startsWith('"') && boundary.endsWith('"')) {
      boundary = boundary.slice(1, -1);
    }

    return boundary;
  }

  public async parse(stream: Readable): Promise<MultipartParseResult> {
    const fields: Record<string, string | string[]> = {};
    const files: Record<string, ParsedFile | ParsedFile[]> = {};
    let fileCount = 0;

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const parts = this.splitIntoParts(buffer);

    for (const part of parts) {
      const { headers, body } = this.parsePart(part);
      const contentDisposition = headers["content-disposition"];

      if (!contentDisposition) continue;

      const { name, filename } =
        this.parseContentDisposition(contentDisposition);
      if (!name) continue;

      if (filename) {
        // Handle file upload
        if (++fileCount > this.options.maxFiles) {
          throw new Error(
            `Maximum file count (${this.options.maxFiles}) exceeded`,
          );
        }

        if (body.length > this.options.maxFileSize) {
          throw new Error(
            `File size exceeds maximum allowed size (${this.options.maxFileSize} bytes)`,
          );
        }

        const tempPath = await this.saveFile(body);
        const mimetype = headers["content-type"] || "application/octet-stream";

        const parsedFile: ParsedFile = {
          fieldName: name,
          filename,
          mimetype,
          size: body.length,
          tempPath,
        };

        if (name in files) {
          const existing = files[name];
          if (Array.isArray(existing)) {
            existing.push(parsedFile);
          } else {
            files[name] = [existing, parsedFile];
          }
        } else {
          files[name] = parsedFile;
        }
      } else {
        // Handle regular field
        const value = body.toString("utf8");

        if (value.length > this.options.maxFieldSize) {
          throw new Error(
            `Field size exceeds maximum allowed size (${this.options.maxFieldSize} bytes)`,
          );
        }

        if (name in fields) {
          const existing = fields[name];
          if (Array.isArray(existing)) {
            existing.push(value);
          } else {
            fields[name] = [existing, value];
          }
        } else {
          fields[name] = value;
        }
      }
    }

    return { fields, files };
  }

  private splitIntoParts(buffer: Buffer): Buffer[] {
    const parts: Buffer[] = [];
    const delimiter = Buffer.from(`\r\n${this.boundaryBuffer}`);
    const endBoundary = Buffer.from(`${this.boundaryBuffer}--`);

    let start = buffer.indexOf(this.boundaryBuffer);
    if (start === -1) return parts;

    start += this.boundaryBuffer.length + 2; // Skip boundary and CRLF

    while (true) {
      let end = buffer.indexOf(delimiter, start);
      if (end === -1) {
        // Check for final boundary
        end = buffer.indexOf(endBoundary, start);
        if (end === -1) break;

        const part = buffer.slice(start, end - 2); // Exclude CRLF before boundary
        if (part.length > 0) parts.push(part);
        break;
      }

      const part = buffer.slice(start, end);
      parts.push(part);
      start = end + delimiter.length + 2; // Skip delimiter and CRLF
    }

    return parts;
  }

  private parsePart(part: Buffer): {
    headers: Record<string, string>;
    body: Buffer;
  } {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      return { headers: {}, body: part };
    }

    const headerSection = part.slice(0, headerEnd).toString("utf8");
    const body = part.slice(headerEnd + 4);

    const headers: Record<string, string> = {};
    const headerLines = headerSection.split("\r\n");

    for (const line of headerLines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;

      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();
      headers[key] = value;
    }

    return { headers, body };
  }

  private parseContentDisposition(value: string): {
    name?: string;
    filename?: string;
  } {
    const result: { name?: string; filename?: string } = {};

    const parts = value.split(";").map((p) => p.trim());

    for (const part of parts) {
      if (part.startsWith("name=")) {
        result.name = this.extractQuotedValue(part.slice(5));
      } else if (part.startsWith("filename=")) {
        result.filename = this.extractQuotedValue(part.slice(9));
      }
    }

    return result;
  }

  private extractQuotedValue(value: string): string {
    value = value.trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    return value;
  }

  private async saveFile(buffer: Buffer): Promise<string> {
    const filename = `upload_${Date.now()}_${randomBytes(8).toString("hex")}`;
    const filepath = join(this.options.uploadDir, filename);

    await fs.writeFile(filepath, buffer);
    return filepath;
  }
}
