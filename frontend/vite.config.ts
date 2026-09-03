import path from "node:path";
import { createRequire } from "node:module";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const require = createRequire(import.meta.url);

function readJsonBody(req: import("node:http").IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function groqAskPlugin(apiKey: string, model: string) {
        const { answerWithGroq } = require(path.resolve(__dirname, "api/ask-handler.js")) as {
    answerWithGroq: (input: {
      apiKey?: string;
      model?: string;
      question?: string;
      chunks?: unknown;
    }) => Promise<{ status: number; body: unknown }>;
  };

  return {
    name: "groq-ask",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use("/api/ask", async (req, res, next) => {
        if (req.method === "OPTIONS") {
          res.statusCode = 200;
          res.end();
          return;
        }
        if (req.method !== "POST") {
          next();
          return;
        }

        try {
          const body = (await readJsonBody(req)) as { question?: string; chunks?: unknown };
          const result = await answerWithGroq({
            apiKey,
            model,
            question: body.question,
            chunks: body.chunks,
          });
          res.statusCode = result.status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result.body));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              detail: error instanceof Error ? error.message : "Ask failed",
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, path.resolve(__dirname, ".."), ""),
    ...loadEnv(mode, path.resolve(__dirname, "../backend"), ""),
    ...loadEnv(mode, __dirname, ""),
  };

  return {
    plugins: [react(), groqAskPlugin(env.GROQ_API_KEY ?? "", env.GROQ_MODEL ?? "")],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
    },
  };
});
