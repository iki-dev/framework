import { ChildProcess, spawn } from "child_process";
import { Command } from "commander";
import { existsSync } from "fs";
import { join } from "path";
import { log } from "../theme.js";

export function registerDevCommands(program: Command): void {
  program
    .command("dev")
    .description("Start development server in watch mode.")
    .option("-p, --port <port>", "Port to run the server on", "4649")
    .action((options) => {
      startDevServer(options.port);
    });
}

function startDevServer(port: string): void {
  const packageJsonPath = join(process.cwd(), "package.json");
  const distPath = join(process.cwd(), "dist");
  const mainPath = join(distPath, "main.js");

  if (!existsSync(packageJsonPath)) {
    log.error("No package.json found in current directory");
    return;
  }

  log.muted("Press Ctrl+C to stop");

  let tscProcess: ChildProcess | null = null;
  let appProcess: ChildProcess | null = null;
  let isShuttingDown = false;

  // Start TypeScript compiler in watch mode
  function startTscWatch(): void {
    tscProcess = spawn("npx", ["tsc", "--watch"], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT: port },
    });

    tscProcess.stdout?.on("data", (data) => {
      const output = data.toString();
      if (output.includes("Found 0 errors")) {
        log.success("TypeScript compilation completed");
        if (existsSync(mainPath)) {
          restartApp();
        }
      } else if (output.includes("error TS")) {
        log.error("TypeScript compilation failed");
      }
    });

    tscProcess.stderr?.on("data", (data) => {
      log.error(`TypeScript compiler error: ${data.toString()}`);
    });

    tscProcess.on("error", (error) => {
      log.error(`Failed to start TypeScript compiler: ${error.message}`);
    });

    tscProcess.on("exit", (code) => {
      if (!isShuttingDown && code !== 0) {
        log.error(`TypeScript compiler exited with code ${code}`);
      }
    });
  }

  // Start the application
  function startApp(): void {
    if (!existsSync(mainPath)) {
      log.warning("main.js not found, waiting for TypeScript compilation...");
      return;
    }

    appProcess = spawn("node", [mainPath], {
      stdio: "inherit",
      env: { ...process.env, PORT: port },
    });

    appProcess.on("error", (error) => {
      log.error(`Failed to start application: ${error.message}`);
    });

    appProcess.on("exit", (code) => {
      if (!isShuttingDown && code !== 0) {
        log.error(`Application exited with code ${code}`);
      }
    });
  }

  // Restart the application
  function restartApp(): void {
    if (appProcess) {
      appProcess.kill();
      appProcess = null;
    }

    // Small delay to ensure process is fully terminated
    setTimeout(() => {
      if (!isShuttingDown) {
        log.info("Restarting application...");
        startApp();
      }
    }, 100);
  }

  // Cleanup function
  function cleanup(): void {
    isShuttingDown = true;

    if (appProcess) {
      appProcess.kill();
      appProcess = null;
    }

    if (tscProcess) {
      tscProcess.kill();
      tscProcess = null;
    }
  }

  // Handle process termination
  process.on("SIGINT", () => {
    log.info("Shutting down development server...");
    cleanup();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });

  // Start the development server
  startTscWatch();

  // Start the app initially if main.js already exists
  if (existsSync(mainPath)) {
    startApp();
  }
}
