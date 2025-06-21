import { test, describe } from "node:test";
import { strict as assert } from "node:assert";
import { UploadedFile } from "./uploaded-file.js";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("UploadedFile", () => {
  const createTempFile = async (content: string): Promise<string> => {
    const tempPath = join(tmpdir(), `test_${Date.now()}_${Math.random()}.txt`);
    await fs.writeFile(tempPath, content);
    return tempPath;
  };

  const ensureDirectoryExists = async (dir: string): Promise<void> => {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // Directory might already exist
    }
  };

  describe("file operations", () => {
    test("should read file contents as buffer", async () => {
      const content = "Hello, World!";
      const tempPath = await createTempFile(content);
      const file = new UploadedFile(
        "test",
        "test.txt",
        "text/plain",
        content.length,
        tempPath,
      );

      const buffer = await file.read();
      assert.equal(buffer.toString(), content);

      // Clean up
      await file.delete();
    });

    test("should read file contents as string", async () => {
      const content = "Hello, UTF-8! 你好!";
      const tempPath = await createTempFile(content);
      const file = new UploadedFile(
        "test",
        "test.txt",
        "text/plain",
        Buffer.byteLength(content),
        tempPath,
      );

      const str = await file.readAsString();
      assert.equal(str, content);

      // Clean up
      await file.delete();
    });

    test("should move file to new location", async () => {
      const content = "File to move";
      const tempPath = await createTempFile(content);
      const destPath = join(tmpdir(), `moved_${Date.now()}.txt`);

      const file = new UploadedFile(
        "test",
        "test.txt",
        "text/plain",
        content.length,
        tempPath,
      );

      await file.moveTo(destPath);

      // Verify file was moved
      const movedContent = await fs.readFile(destPath, "utf8");
      assert.equal(movedContent, content);

      // Original should not exist
      await assert.rejects(fs.access(tempPath));

      // Clean up
      await fs.unlink(destPath);
    });

    test("should save file to directory", async () => {
      const content = "File to save";
      const tempPath = await createTempFile(content);
      const saveDir = join(tmpdir(), "uploads");
      await ensureDirectoryExists(saveDir);

      const file = new UploadedFile(
        "test",
        "original.txt",
        "text/plain",
        content.length,
        tempPath,
      );

      const savedPath = await file.saveTo(saveDir);
      assert.equal(savedPath, join(saveDir, "original.txt"));

      const savedContent = await fs.readFile(savedPath, "utf8");
      assert.equal(savedContent, content);

      // Clean up
      await fs.unlink(savedPath);
    });

    test("should save file with new name", async () => {
      const content = "File to rename";
      const tempPath = await createTempFile(content);
      const saveDir = join(tmpdir(), "uploads");
      await ensureDirectoryExists(saveDir);

      const file = new UploadedFile(
        "test",
        "original.txt",
        "text/plain",
        content.length,
        tempPath,
      );

      const savedPath = await file.saveTo(saveDir, "renamed.txt");
      assert.equal(savedPath, join(saveDir, "renamed.txt"));

      const savedContent = await fs.readFile(savedPath, "utf8");
      assert.equal(savedContent, content);

      // Clean up
      await fs.unlink(savedPath);
    });

    test("should delete temporary file", async () => {
      const tempPath = await createTempFile("To be deleted");
      const file = new UploadedFile(
        "test",
        "test.txt",
        "text/plain",
        13,
        tempPath,
      );

      await file.delete();

      // File should not exist
      await assert.rejects(fs.access(tempPath));
    });

    test("should handle delete on non-existent file", async () => {
      const file = new UploadedFile(
        "test",
        "test.txt",
        "text/plain",
        0,
        "/non/existent/file.txt",
      );

      // Should not throw
      await file.delete();
    });
  });

  describe("file properties", () => {
    test("should extract file extension", () => {
      const file1 = new UploadedFile(
        "test",
        "document.pdf",
        "application/pdf",
        100,
        "/tmp/file1",
      );
      assert.equal(file1.extension, ".pdf");

      const file2 = new UploadedFile(
        "test",
        "archive.tar.gz",
        "application/gzip",
        100,
        "/tmp/file2",
      );
      assert.equal(file2.extension, ".gz");

      const file3 = new UploadedFile(
        "test",
        "no-extension",
        "text/plain",
        100,
        "/tmp/file3",
      );
      assert.equal(file3.extension, "");
    });

    test("should get name without extension", () => {
      const file1 = new UploadedFile(
        "test",
        "document.pdf",
        "application/pdf",
        100,
        "/tmp/file1",
      );
      assert.equal(file1.nameWithoutExtension, "document");

      const file2 = new UploadedFile(
        "test",
        "archive.tar.gz",
        "application/gzip",
        100,
        "/tmp/file2",
      );
      assert.equal(file2.nameWithoutExtension, "archive.tar");

      const file3 = new UploadedFile(
        "test",
        "no-extension",
        "text/plain",
        100,
        "/tmp/file3",
      );
      assert.equal(file3.nameWithoutExtension, "no-extension");
    });

    test("should check if file is image", () => {
      const image1 = new UploadedFile(
        "test",
        "photo.jpg",
        "image/jpeg",
        100,
        "/tmp/file1",
      );
      assert.ok(image1.isImage());

      const image2 = new UploadedFile(
        "test",
        "icon.png",
        "image/png",
        100,
        "/tmp/file2",
      );
      assert.ok(image2.isImage());

      const document = new UploadedFile(
        "test",
        "doc.pdf",
        "application/pdf",
        100,
        "/tmp/file3",
      );
      assert.ok(!document.isImage());
    });

    test("should check mimetype", () => {
      const file = new UploadedFile(
        "test",
        "photo.jpg",
        "image/jpeg",
        100,
        "/tmp/file",
      );

      assert.ok(file.isMimetype("image/jpeg"));
      assert.ok(!file.isMimetype("image/png"));

      // Array of mimetypes
      assert.ok(file.isMimetype(["image/jpeg", "image/png"]));
      assert.ok(!file.isMimetype(["image/png", "image/gif"]));
    });
  });

  describe("constructor properties", () => {
    test("should store all properties correctly", () => {
      const file = new UploadedFile(
        "avatar",
        "profile.jpg",
        "image/jpeg",
        2048,
        "/tmp/upload_123",
      );

      assert.equal(file.fieldName, "avatar");
      assert.equal(file.filename, "profile.jpg");
      assert.equal(file.mimetype, "image/jpeg");
      assert.equal(file.size, 2048);
      assert.equal(file.tempPath, "/tmp/upload_123");
    });
  });
});
