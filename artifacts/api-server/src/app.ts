import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env["SERVE_WEB"] === "true") {
  const webRoot = resolve(
    process.cwd(),
    "artifacts/catus-synergy/dist/public",
  );
  const indexPath = join(webRoot, "index.html");

  if (!existsSync(indexPath)) {
    throw new Error(`Web build was not found at ${webRoot}`);
  }

  app.use(express.static(webRoot, { index: false }));
  app.get("/{*splat}", (req, res, next) => {
    if (
      req.path === "/api" ||
      req.path.startsWith("/api/") ||
      !req.accepts("html")
    ) {
      next();
      return;
    }

    res.sendFile(indexPath, (error) => {
      if (error) next(error);
    });
  });
}

export default app;
