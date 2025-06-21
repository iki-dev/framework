#!/usr/bin/env node

import { Command } from "commander";

// Import command modules
import { registerDevCommands } from "./commands/dev.js";

const program = new Command();

program.name("iki").description("Iki - Code with calm.");

// Register command namespaces
registerDevCommands(program);

// Parse arguments
program.parse();
