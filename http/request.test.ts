import { test, describe } from "node:test";
import { strict as assert } from "node:assert";
import { Request } from "./request.js";
import { UploadedFile } from "./uploaded-file.js";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Request", () => {
  describe("file handling", () => {
    const createTempFile = async (content: string): Promise<string> => {
      const tempPath = join(tmpdir(), `test_${Date.now()}.txt`);
      await fs.writeFile(tempPath, content);
      return tempPath;
    };

    test("should store and retrieve uploaded files", async () => {
      const tempPath = await createTempFile("test content");
      const uploadedFile = new UploadedFile(
        "document",
        "test.txt",
        "text/plain",
        12,
        tempPath,
      );

      const request = new Request(
        "POST",
        "/upload",
        {},
        { title: "Test" },
        {},
        {},
        { document: uploadedFile },
      );

      assert.ok(request.hasFile("document"));
      assert.ok(!request.hasFile("nonexistent"));

      const file = request.file("document");
      assert.ok(file);
      assert.ok(file instanceof UploadedFile);
      assert.equal((file as UploadedFile).filename, "test.txt");

      // Clean up
      try {
        await fs.unlink(tempPath);
      } catch {
        // File might already be deleted
      }
    });

    test("should handle multiple files with same field name", async () => {
      const tempPath1 = await createTempFile("content 1");
      const tempPath2 = await createTempFile("content 2");

      const file1 = new UploadedFile(
        "files",
        "file1.txt",
        "text/plain",
        9,
        tempPath1,
      );
      const file2 = new UploadedFile(
        "files",
        "file2.txt",
        "text/plain",
        9,
        tempPath2,
      );

      const request = new Request(
        "POST",
        "/upload",
        {},
        {},
        {},
        {},
        { files: [file1, file2] },
      );

      const files = request.files("files");
      assert.equal(files.length, 2);
      assert.equal(files[0].filename, "file1.txt");
      assert.equal(files[1].filename, "file2.txt");

      // Test singleFile returns first file
      const singleFile = request.singleFile("files");
      assert.ok(singleFile);
      assert.equal(singleFile.filename, "file1.txt");

      // Clean up
      try {
        await fs.unlink(tempPath1);
      } catch {
        // File might already be deleted
      }
      try {
        await fs.unlink(tempPath2);
      } catch {
        // File might already be deleted
      }
    });

    test("should return empty array for non-existent files", () => {
      const request = new Request("POST", "/upload", {}, {}, {}, {}, {});

      const files = request.files("nonexistent");
      assert.ok(Array.isArray(files));
      assert.equal(files.length, 0);

      const singleFile = request.singleFile("nonexistent");
      assert.equal(singleFile, undefined);
    });

    test("should get all files as flat array", async () => {
      const tempPath1 = await createTempFile("content 1");
      const tempPath2 = await createTempFile("content 2");
      const tempPath3 = await createTempFile("content 3");

      const file1 = new UploadedFile(
        "doc",
        "doc.txt",
        "text/plain",
        9,
        tempPath1,
      );
      const file2 = new UploadedFile(
        "images",
        "img1.jpg",
        "image/jpeg",
        9,
        tempPath2,
      );
      const file3 = new UploadedFile(
        "images",
        "img2.jpg",
        "image/jpeg",
        9,
        tempPath3,
      );

      const request = new Request(
        "POST",
        "/upload",
        {},
        {},
        {},
        {},
        { doc: file1, images: [file2, file3] },
      );

      const allFiles = request.getAllFiles();
      assert.equal(allFiles.length, 3);

      const filenames = allFiles.map((f) => f.filename).sort();
      assert.deepEqual(filenames, ["doc.txt", "img1.jpg", "img2.jpg"]);

      // Clean up
      try {
        await fs.unlink(tempPath1);
      } catch {
        // File might already be deleted
      }
      try {
        await fs.unlink(tempPath2);
      } catch {
        // File might already be deleted
      }
      try {
        await fs.unlink(tempPath3);
      } catch {
        // File might already be deleted
      }
    });

    test("should return immutable files object", async () => {
      const tempPath = await createTempFile("test content");
      const uploadedFile = new UploadedFile(
        "document",
        "test.txt",
        "text/plain",
        12,
        tempPath,
      );

      const request = new Request(
        "POST",
        "/upload",
        {},
        {},
        {},
        {},
        { document: uploadedFile },
      );

      const files1 = request.allFiles;
      const files2 = request.allFiles;

      // Should return new object each time
      assert.notStrictEqual(files1, files2);
      assert.deepEqual(files1, files2);

      // Modifying returned object shouldn't affect internal state
      delete files1.document;
      assert.ok(request.hasFile("document"));

      // Clean up
      try {
        await fs.unlink(tempPath);
      } catch {
        // File might already be deleted
      }
    });
  });

  describe("existing functionality", () => {
    test("should handle headers correctly", () => {
      const headers = {
        "Content-Type": "application/json",
        "X-Custom-Header": "value",
      };

      const request = new Request("GET", "/test", headers);

      assert.equal(request.header("content-type"), "application/json");
      assert.equal(request.header("Content-Type"), "application/json");
      assert.equal(request.header("x-custom-header"), "value");
      assert.ok(request.hasHeader("content-type"));
      assert.ok(!request.hasHeader("nonexistent"));
    });

    test("should handle query parameters", () => {
      const query = {
        page: "1",
        sort: "asc",
        filters: ["active", "verified"],
      };

      const request = new Request("GET", "/test", {}, undefined, query);

      assert.equal(request.query("page"), "1");
      assert.equal(request.query("sort"), "asc");
      assert.deepEqual(request.query("filters"), ["active", "verified"]);
      assert.ok(request.hasQuery("page"));
      assert.ok(!request.hasQuery("nonexistent"));
    });

    test("should handle route parameters", () => {
      const request = new Request(
        "GET",
        "/users/123",
        {},
        undefined,
        {},
        { id: "123" },
      );

      assert.equal(request.routeParameter("id"), "123");
      assert.ok(request.hasRouteParameter("id"));
      assert.ok(!request.hasRouteParameter("nonexistent"));
    });

    test("should handle get() method with query and body", () => {
      const request = new Request(
        "POST",
        "/test",
        {},
        { name: "John", age: 30 },
        { page: "1" },
      );

      // Query takes precedence
      assert.equal(request.get("page"), "1");
      assert.equal(request.get("name"), "John");
      assert.equal(request.get("age"), 30);
      assert.equal(request.get("nonexistent", "default"), "default");
    });

    test("should handle has() method", () => {
      const request = new Request(
        "POST",
        "/test",
        {},
        { name: "John" },
        { page: "1" },
      );

      assert.ok(request.has("page"));
      assert.ok(request.has("name"));
      assert.ok(!request.has("nonexistent"));
    });
  });
});
