import { writeFileSync, existsSync } from "fs";
import path from "path";
import os from "os";

const CONFIG_PATHS = [
  path.join(process.cwd(), ".z-ai-config"),
  path.join(os.homedir(), ".z-ai-config"),
  "/etc/.z-ai-config",
];

const ZAI_CONFIG = {
  baseUrl: "https://internal-api.z.ai/v1",
  apiKey: "Z.ai",
};

export function ensureZAIConfig() {
  for (const p of CONFIG_PATHS) {
    try {
      if (existsSync(p)) return true;
    } catch {}
  }
  try {
    writeFileSync(
      path.join(process.cwd(), ".z-ai-config"),
      JSON.stringify(ZAI_CONFIG)
    );
    return true;
  } catch {
    return false;
  }
}
