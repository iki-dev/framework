/**
 * Iki theme for CLI output
 * Japanese-inspired color palette emphasizing harmony and balance
 * Colors based on traditional Japanese aesthetics for sophisticated terminal experience
 */

export const colors = {
  // Iki neutral base colors
  base: "\x1b[0m", // Reset to default
  muted: "\x1b[90m", // Gray Soft for secondary text
  subtle: "\x1b[37m", // Hinoki Wood tones for hints

  // Semantic colors (Iki design system)
  success: "\x1b[32m", // Soft green for success states
  error: "\x1b[31m", // Muted red for errors
  warning: "\x1b[33m", // Urushi Gold for warnings
  info: "\x1b[34m", // Aizome Blue for info

  // Text emphasis
  bold: "\x1b[1m", // Bold text
  dim: "\x1b[2m", // Dimmed text

  // Reset
  reset: "\x1b[0m",
} as const;

export function colorize(color: keyof typeof colors, text: string): string {
  return `${colors[color]}${text}${colors.reset}`;
}

export const log = {
  success: (message: string) => console.log(colorize("success", message)),
  error: (message: string) => console.error(colorize("error", message)),
  warning: (message: string) => console.log(colorize("warning", message)),
  info: (message: string) => console.log(colorize("info", message)),
  muted: (message: string) => console.log(colorize("muted", message)),
  bold: (message: string) => console.log(colorize("bold", message)),
} as const;
