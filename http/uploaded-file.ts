import { promises as fs } from "node:fs";
import { basename, join } from "node:path";

export class UploadedFile {
  constructor(
    public readonly fieldName: string,
    public readonly filename: string,
    public readonly mimetype: string,
    public readonly size: number,
    public readonly tempPath: string,
  ) {}

  /**
   * Move the uploaded file to a new location.
   *
   * @param destination The destination path
   * @throws Error if the file cannot be moved
   */
  public async moveTo(destination: string): Promise<void> {
    try {
      await fs.rename(this.tempPath, destination);
    } catch (error: unknown) {
      // If rename fails (e.g., across filesystems), fall back to copy and delete
      if (error instanceof Error && "code" in error && error.code === "EXDEV") {
        await fs.copyFile(this.tempPath, destination);
        await fs.unlink(this.tempPath);
      } else {
        throw error;
      }
    }
  }

  /**
   * Save the uploaded file to a directory with an optional new name.
   *
   * @param directory The directory to save to
   * @param newFilename Optional new filename (defaults to original)
   * @returns The full path where the file was saved
   */
  public async saveTo(
    directory: string,
    newFilename?: string,
  ): Promise<string> {
    const filename = newFilename || this.filename;
    const destination = join(directory, filename);
    await this.moveTo(destination);
    return destination;
  }

  /**
   * Read the contents of the uploaded file.
   *
   * @returns The file contents as a Buffer
   */
  public async read(): Promise<Buffer> {
    return fs.readFile(this.tempPath);
  }

  /**
   * Read the contents of the uploaded file as a string.
   *
   * @param encoding The encoding to use (default: utf8)
   * @returns The file contents as a string
   */
  public async readAsString(
    encoding: BufferEncoding = "utf8",
  ): Promise<string> {
    const buffer = await this.read();
    return buffer.toString(encoding);
  }

  /**
   * Delete the temporary file.
   */
  public async delete(): Promise<void> {
    try {
      await fs.unlink(this.tempPath);
    } catch (error: unknown) {
      // Ignore error if file already deleted
      if (
        !(error instanceof Error && "code" in error && error.code === "ENOENT")
      ) {
        throw error;
      }
    }
  }

  /**
   * Get the file extension based on the filename.
   */
  public get extension(): string {
    const parts = this.filename.split(".");
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : "";
  }

  /**
   * Get the base name without extension.
   */
  public get nameWithoutExtension(): string {
    const base = basename(this.filename);
    const ext = this.extension;
    return ext ? base.slice(0, -ext.length) : base;
  }

  /**
   * Check if the file is an image based on mimetype.
   */
  public isImage(): boolean {
    return this.mimetype.startsWith("image/");
  }

  /**
   * Check if the file is a specific mimetype.
   */
  public isMimetype(mimetype: string | string[]): boolean {
    if (Array.isArray(mimetype)) {
      return mimetype.includes(this.mimetype);
    }
    return this.mimetype === mimetype;
  }
}
