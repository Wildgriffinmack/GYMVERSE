import { networkInterfaces } from "node:os";
import { parseArgs } from "node:util";
import { ConfigError, loadConfig } from "./config.ts";
import type { GuardianConfig } from "./config.ts";
import { Guardian } from "./guardian.ts";
import { createGuardianServer } from "./http/server.ts";
import { createLogger } from "./log.ts";
import type { Logger } from "./log.ts";
import { UnimplementedMediaModerator } from "./media/moderator.ts";
import type { ModelAdapter } from "./model/adapter.ts";
import { OllamaAdapter } from "./model/ollama.ts";
import { BoundedQueue } from "./model/queue.ts";
import { RuleEngine, loadLexicon } from "./policy/engine.ts";
import { ReviewStore } from "./review/store.ts";
import { seedDemoData } from "./review/seed.ts";

export function buildModel(config: GuardianConfig): ModelAdapter | null {
  if (config.model.provider === "ollama") {
    return new OllamaAdapter({ baseUrl: config.model.ollamaUrl, model: config.model.name, think: config.model.think });
  }
  return null;
}

export function buildGuardian(config: GuardianConfig, log: Logger) {
  const engine = new RuleEngine({ lexicon: config.lexiconPath ? loadLexicon(config.lexiconPath) : [] });
  const store = new ReviewStore();
  const queue = new BoundedQueue({ concurrency: config.model.concurrency, maxWaiting: config.model.maxWaiting, timeoutMs: config.model.timeoutMs });
  const model = buildModel(config);
  const guardian = new Guardian({ engine, store, media: new UnimplementedMediaModerator(), model, queue, log, screenAll: config.model.screenAll });
  return { guardian, store, queue, model };
}

function lanAddresses(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i): i is NonNullable<typeof i> => !!i && i.family === "IPv4" && !i.internal)
    .map((i) => i.address);
}

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { lan: { type: "boolean", default: false }, port: { type: "string" } }, allowPositionals: false });
  let config: GuardianConfig;
  try {
    config = loadConfig(process.env, { lan: values.lan, port: values.port ? Number(values.port) : undefined });
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`Guardian config error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
  const log = createLogger(config.logLevel);
  const { guardian, store, queue, model } = buildGuardian(config, log);
  if (config.demoData) await seedDemoData(guardian, store);

  const server = createGuardianServer({
    config,
    guardian,
    store,
    queue,
    log,
    modelHealth: async () => (model ? model.health() : null),
  });
  server.requestTimeout = Math.max(30000, config.model.timeoutMs + 5000);
  server.headersTimeout = 15000;

  server.listen(config.port, config.host, async () => {
    const lines = [
      "",
      "  GYMX Guardian (prototype) is running",
      `  Local API:      http://127.0.0.1:${config.port}/v1/moderate`,
      ...(config.host === "0.0.0.0" ? lanAddresses().map((a) => `  Phones (LAN):   http://${a}:${config.port}   ← use this in Expo Go`) : ["  Phones:         not reachable (start with --lan to allow your Wi-Fi)"]),
      `  Moderator UI:   http://127.0.0.1:${config.port}/admin   (this computer only)`,
      config.adminTokenGenerated ? `  Moderator token (generated for this run): ${config.adminToken}` : "  Moderator token: from GUARDIAN_ADMIN_TOKEN",
      `  DM reveal:      ${config.trustSafetyToken ? "enabled for the Trust & Safety token" : "disabled (set GUARDIAN_TRUST_SAFETY_TOKEN to enable)"}`,
    ];
    if (model) {
      const h = await model.health();
      lines.push(`  Local model:    ${model.provider}/${model.model} — ${h.ok ? "ready" : h.detail}`);
    } else {
      lines.push("  Local model:    off (rules only). Set GUARDIAN_MODEL_PROVIDER=ollama to enable.");
    }
    lines.push(config.demoData ? "  Demo data:      loaded (GUARDIAN_DEMO_DATA=false to disable)" : "  Demo data:      off", "");
    console.log(lines.join("\n"));
  });

  const shutdown = (signal: string) => {
    log.info("shutdown", { signal });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

if (import.meta.main) {
  void main();
}
