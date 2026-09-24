import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const port = 5433;
const dataDir = path.join(process.cwd(), "data", "pglite");
const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable&connection_limit=1&pgbouncer=true`;

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function main() {
  fs.mkdirSync(dataDir, { recursive: true });
  const envPath = path.join(process.cwd(), ".env");
  const kept = fs.existsSync(envPath)
    ? fs
        .readFileSync(envPath, "utf8")
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith("DATABASE_URL="))
    : [];
  fs.writeFileSync(envPath, [`DATABASE_URL="${databaseUrl}"`, ...kept].join("\n") + "\n");
  process.env.DATABASE_URL = databaseUrl;

  console.log("Starting local PostgreSQL…");
  const db = await PGlite.create(dataDir);
  const server = new PGLiteSocketServer({
    db,
    port,
    host: "127.0.0.1",
    maxConnections: 8,
  });
  await server.start();

  await run("npx", ["prisma", "generate"]);
  await run("npx", ["prisma", "migrate", "deploy"]);
  await run("npx", ["tsx", "prisma/seed.ts"]);

  const next = spawn("npx", ["next", "dev"], {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  let stopping = false;
  const shutdown = async (code = 0) => {
    if (stopping) return;
    stopping = true;
    if (!next.killed) next.kill();
    try {
      await server.stop();
      await db.close();
    } catch (error) {
      console.error(error);
    }
    process.exit(code);
  };

  process.on("SIGINT", () => {
    void shutdown(0);
  });
  process.on("SIGTERM", () => {
    void shutdown(0);
  });
  next.on("exit", (code) => {
    void shutdown(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
