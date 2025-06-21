import { Middleware, NextFunction } from "../http/middleware.js";
import { Request } from "../http/request.js";
import { Response } from "../http/response.js";
import { tmpdir } from "node:os";

export interface BodyParserOptions {
  /**
   * Maximum allowed size for JSON body in bytes
   * Default: 1MB
   */
  jsonLimit?: number;

  /**
   * Maximum allowed size for text body in bytes
   * Default: 1MB
   */
  textLimit?: number;

  /**
   * Maximum allowed size for individual files in bytes
   * Default: 10MB
   */
  fileLimit?: number;

  /**
   * Maximum number of files allowed
   * Default: 10
   */
  maxFiles?: number;

  /**
   * Maximum allowed size for form fields in bytes
   * Default: 1MB
   */
  fieldLimit?: number;

  /**
   * Directory for storing uploaded files
   * Default: system temp directory
   */
  uploadDir?: string;

  /**
   * Whether to automatically clean up temporary files after request
   * Default: true
   */
  cleanupFiles?: boolean;

  /**
   * File extensions to accept (e.g., ['.jpg', '.png', '.pdf'])
   * Default: all extensions allowed
   */
  allowedExtensions?: string[];

  /**
   * Mime types to accept (e.g., ['image/jpeg', 'image/png'])
   * Default: all mime types allowed
   */
  allowedMimeTypes?: string[];
}

export class BodyParserMiddleware extends Middleware {
  private options: Required<
    Omit<BodyParserOptions, "allowedExtensions" | "allowedMimeTypes">
  > &
    Pick<BodyParserOptions, "allowedExtensions" | "allowedMimeTypes">;

  constructor(options: BodyParserOptions = {}) {
    super();
    this.options = {
      jsonLimit: options.jsonLimit ?? 1 * 1024 * 1024, // 1MB
      textLimit: options.textLimit ?? 1 * 1024 * 1024, // 1MB
      fileLimit: options.fileLimit ?? 10 * 1024 * 1024, // 10MB
      maxFiles: options.maxFiles ?? 10,
      fieldLimit: options.fieldLimit ?? 1 * 1024 * 1024, // 1MB
      uploadDir: options.uploadDir ?? tmpdir(),
      cleanupFiles: options.cleanupFiles ?? true,
      allowedExtensions: options.allowedExtensions,
      allowedMimeTypes: options.allowedMimeTypes,
    };
  }

  public async handle(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    // Validate uploaded files if any
    if (request.getAllFiles().length > 0) {
      const allFiles = request.getAllFiles();

      // Check file count
      if (allFiles.length > this.options.maxFiles) {
        response.status(400).json({
          error: `Too many files uploaded. Maximum allowed: ${this.options.maxFiles}`,
        });
        return;
      }

      // Validate each file
      for (const file of allFiles) {
        // Check file size
        if (file.size > this.options.fileLimit) {
          response.status(400).json({
            error: `File "${file.filename}" exceeds maximum size of ${this.options.fileLimit} bytes`,
          });
          return;
        }

        // Check allowed extensions
        if (this.options.allowedExtensions) {
          const ext = file.extension.toLowerCase();
          if (!this.options.allowedExtensions.includes(ext)) {
            response.status(400).json({
              error: `File extension "${ext}" is not allowed. Allowed extensions: ${this.options.allowedExtensions.join(", ")}`,
            });
            return;
          }
        }

        // Check allowed mime types
        if (this.options.allowedMimeTypes) {
          if (!this.options.allowedMimeTypes.includes(file.mimetype)) {
            response.status(400).json({
              error: `File type "${file.mimetype}" is not allowed. Allowed types: ${this.options.allowedMimeTypes.join(", ")}`,
            });
            return;
          }
        }
      }
    }

    // Add cleanup handler if enabled
    if (this.options.cleanupFiles && request.getAllFiles().length > 0) {
      const originalMarkSent = response.markSent.bind(response);
      response.markSent = function () {
        originalMarkSent();
        // Clean up files after response is sent
        setImmediate(async () => {
          const files = request.getAllFiles();
          for (const file of files) {
            try {
              await file.delete();
            } catch (error) {
              // Log error but don't throw
              console.error(
                `Failed to cleanup uploaded file: ${file.tempPath}`,
                error,
              );
            }
          }
        });
      };
    }

    // Check content length for non-multipart requests
    const contentLength = parseInt(
      (request.header("content-length") as string) || "0",
      10,
    );
    const contentType = (request.header("content-type") as string) || "";

    if (contentLength > 0 && !contentType.includes("multipart/form-data")) {
      if (
        contentType.includes("application/json") &&
        contentLength > this.options.jsonLimit
      ) {
        response.status(413).json({
          error: `Request body too large. Maximum JSON size: ${this.options.jsonLimit} bytes`,
        });
        return;
      }

      if (
        !contentType.includes("application/json") &&
        contentLength > this.options.textLimit
      ) {
        response.status(413).json({
          error: `Request body too large. Maximum size: ${this.options.textLimit} bytes`,
        });
        return;
      }
    }

    await next();
  }
}
