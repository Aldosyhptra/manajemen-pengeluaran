import * as readline from "node:readline";
import { hashPassword } from "../src/lib/auth";

function readHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    const stdin = process.stdin;
    const stdout = process.stdout;
    stdout.write(prompt);
    const isTTY = Boolean(stdin.isTTY);
    if (isTTY) (stdin as unknown as { setRawMode: (b: boolean) => void }).setRawMode?.(true);
    let value = "";
    const onData = (chunk: Buffer) => {
      const s = chunk.toString("utf8");
      for (const ch of s) {
        if (ch === "\n" || ch === "\r") {
          stdin.off("data", onData);
          stdout.write("\n");
          if (isTTY) (stdin as unknown as { setRawMode: (b: boolean) => void }).setRawMode?.(false);
          rl.close();
          resolve(value);
          return;
        }
        if (ch === "\u0003") process.exit(1);
        if (ch === "\u007f" || ch === "\b") {
          if (value.length > 0) value = value.slice(0, -1);
          continue;
        }
        value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const pw = await readHidden("Password (minimal 10 karakter, input tersembunyi): ");
  if (pw.length < 10) {
    console.error("Password minimal 10 karakter.");
    process.exit(1);
  }
  const hash = hashPassword(pw);
  console.log(hash);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
