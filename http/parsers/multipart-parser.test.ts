import { test, describe } from "node:test";
import { strict as assert } from "node:assert";
import { Readable } from "node:stream";
import { MultipartParser } from "./multipart-parser.js";
import { promises as fs } from "node:fs";
import { UploadedFile } from "../uploaded-file.js";

describe("MultipartParser", () => {
  describe("constructor", () => {
    test("should extract boundary from content-type", () => {
      const parser = new MultipartParser(
        'multipart/form-data; boundary="----WebKitFormBoundary7MA4YWxkTrZu0gW"',
      );
      assert.ok(parser);
    });

    test("should handle boundary without quotes", () => {
      const parser = new MultipartParser(
        "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
      );
      assert.ok(parser);
    });

    test("should throw error on missing boundary", () => {
      assert.throws(
        () => new MultipartParser("multipart/form-data"),
        /Invalid multipart content-type: missing boundary/,
      );
    });
  });

  describe("parse", () => {
    const createMultipartData = (
      boundary: string,
      parts: Array<{
        name: string;
        filename?: string;
        contentType?: string;
        data: string | Buffer;
      }>,
    ): Buffer => {
      const chunks: Buffer[] = [];

      for (const part of parts) {
        chunks.push(Buffer.from(`--${boundary}\r\n`));

        let contentDisposition = `Content-Disposition: form-data; name="${part.name}"`;
        if (part.filename) {
          contentDisposition += `; filename="${part.filename}"`;
        }
        chunks.push(Buffer.from(`${contentDisposition}\r\n`));

        if (part.contentType) {
          chunks.push(Buffer.from(`Content-Type: ${part.contentType}\r\n`));
        }

        chunks.push(Buffer.from("\r\n"));
        chunks.push(
          Buffer.isBuffer(part.data) ? part.data : Buffer.from(part.data),
        );
        chunks.push(Buffer.from("\r\n"));
      }

      chunks.push(Buffer.from(`--${boundary}--\r\n`));

      return Buffer.concat(chunks);
    };

    test("should parse simple text fields", async () => {
      const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
      const data = createMultipartData(boundary, [
        { name: "username", data: "john_doe" },
        { name: "email", data: "john@example.com" },
      ]);

      const stream = Readable.from([data]);
      const parser = new MultipartParser(
        `multipart/form-data; boundary="${boundary}"`,
      );
      const result = await parser.parse(stream);

      assert.deepEqual(result.fields, {
        username: "john_doe",
        email: "john@example.com",
      });
      assert.deepEqual(result.files, {});
    });

    test("should parse file uploads", async () => {
      const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
      const fileContent = "Hello, World!";
      const data = createMultipartData(boundary, [
        {
          name: "document",
          filename: "test.txt",
          contentType: "text/plain",
          data: fileContent,
        },
      ]);

      const stream = Readable.from([data]);
      const parser = new MultipartParser(
        `multipart/form-data; boundary="${boundary}"`,
      );
      const result = await parser.parse(stream);

      assert.deepEqual(result.fields, {});
      assert.ok(result.files.document);
      assert.ok(!Array.isArray(result.files.document));

      const file = result.files.document as UploadedFile;
      assert.equal(file.fieldName, "document");
      assert.equal(file.filename, "test.txt");
      assert.equal(file.mimetype, "text/plain");
      assert.equal(file.size, fileContent.length);
      assert.ok(file.tempPath);

      // Verify file content
      const savedContent = await fs.readFile(file.tempPath, "utf8");
      assert.equal(savedContent, fileContent);

      // Clean up
      await fs.unlink(file.tempPath);
    });

    test("should parse mixed fields and files", async () => {
      const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
      const data = createMultipartData(boundary, [
        { name: "title", data: "My Document" },
        {
          name: "file",
          filename: "doc.txt",
          contentType: "text/plain",
          data: "Document content",
        },
        { name: "description", data: "A test document" },
      ]);

      const stream = Readable.from([data]);
      const parser = new MultipartParser(
        `multipart/form-data; boundary="${boundary}"`,
      );
      const result = await parser.parse(stream);

      assert.deepEqual(result.fields, {
        title: "My Document",
        description: "A test document",
      });

      assert.ok(result.files.file);
      const file = result.files.file as UploadedFile;
      assert.equal(file.filename, "doc.txt");

      // Clean up
      await fs.unlink(file.tempPath);
    });

    test("should handle multiple files with same field name", async () => {
      const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
      const data = createMultipartData(boundary, [
        {
          name: "files",
          filename: "file1.txt",
          contentType: "text/plain",
          data: "File 1 content",
        },
        {
          name: "files",
          filename: "file2.txt",
          contentType: "text/plain",
          data: "File 2 content",
        },
      ]);

      const stream = Readable.from([data]);
      const parser = new MultipartParser(
        `multipart/form-data; boundary="${boundary}"`,
      );
      const result = await parser.parse(stream);

      assert.ok(Array.isArray(result.files.files));
      assert.equal(result.files.files.length, 2);
      assert.equal(result.files.files[0].filename, "file1.txt");
      assert.equal(result.files.files[1].filename, "file2.txt");

      // Clean up
      for (const file of result.files.files) {
        await fs.unlink(file.tempPath);
      }
    });

    test("should handle multiple values with same field name", async () => {
      const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
      const data = createMultipartData(boundary, [
        { name: "tags", data: "javascript" },
        { name: "tags", data: "typescript" },
        { name: "tags", data: "nodejs" },
      ]);

      const stream = Readable.from([data]);
      const parser = new MultipartParser(
        `multipart/form-data; boundary="${boundary}"`,
      );
      const result = await parser.parse(stream);

      assert.ok(Array.isArray(result.fields.tags));
      assert.deepEqual(result.fields.tags, [
        "javascript",
        "typescript",
        "nodejs",
      ]);
    });

    test("should enforce maxFileSize limit", async () => {
      const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
      const largeData = Buffer.alloc(1024); // 1KB
      const data = createMultipartData(boundary, [
        {
          name: "file",
          filename: "large.bin",
          contentType: "application/octet-stream",
          data: largeData,
        },
      ]);

      const stream = Readable.from([data]);
      const parser = new MultipartParser(
        `multipart/form-data; boundary="${boundary}"`,
        { maxFileSize: 512 }, // 512 bytes limit
      );

      await assert.rejects(
        parser.parse(stream),
        /File size exceeds maximum allowed size/,
      );
    });

    test("should enforce maxFiles limit", async () => {
      const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
      const data = createMultipartData(boundary, [
        {
          name: "file1",
          filename: "file1.txt",
          contentType: "text/plain",
          data: "File 1",
        },
        {
          name: "file2",
          filename: "file2.txt",
          contentType: "text/plain",
          data: "File 2",
        },
        {
          name: "file3",
          filename: "file3.txt",
          contentType: "text/plain",
          data: "File 3",
        },
      ]);

      const stream = Readable.from([data]);
      const parser = new MultipartParser(
        `multipart/form-data; boundary="${boundary}"`,
        { maxFiles: 2 },
      );

      await assert.rejects(
        parser.parse(stream),
        /Maximum file count \(2\) exceeded/,
      );
    });

    test("should handle empty parts", async () => {
      const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
      const data = createMultipartData(boundary, [
        { name: "empty", data: "" },
        { name: "filled", data: "some content" },
      ]);

      const stream = Readable.from([data]);
      const parser = new MultipartParser(
        `multipart/form-data; boundary="${boundary}"`,
      );
      const result = await parser.parse(stream);

      assert.equal(result.fields.empty, "");
      assert.equal(result.fields.filled, "some content");
    });

    test("should handle special characters in field values", async () => {
      const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
      const specialContent = 'Special chars: "quotes", \n newlines, émojis 🎉';
      const data = createMultipartData(boundary, [
        { name: "special", data: specialContent },
      ]);

      const stream = Readable.from([data]);
      const parser = new MultipartParser(
        `multipart/form-data; boundary="${boundary}"`,
      );
      const result = await parser.parse(stream);

      assert.equal(result.fields.special, specialContent);
    });
  });
});
