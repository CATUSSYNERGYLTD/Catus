import { eq } from "drizzle-orm";
import express, { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import {
  ChangeAdminPasswordBody,
  ChangeAdminPasswordResponse,
  GetAdminStatusResponse,
  GetSiteContentResponse,
  LoginAdminBody,
  LoginAdminResponse,
  LogoutAdminResponse,
  UpdateSiteContentBody,
  UpdateSiteContentResponse,
  UploadAdminImageResponse,
} from "@workspace/api-zod";
import { adminAccountTable, db, siteContentTable } from "@workspace/db";
import {
  ADMIN_USERNAME,
  clearAdminSessionCookie,
  constantTimeStringEqual,
  hashAdminPassword,
  readAdminSession,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "../lib/admin-auth";
import {
  isSupportedImageContentType,
  maxImageUploadBytes,
  normalizeImageContentType,
  SupabaseStorageError,
  uploadPublicSiteImage,
} from "../lib/supabase-storage";

const router: IRouter = Router();
const loginWindowMs = 15 * 60 * 1000;
const loginLimit = 5;
const failedLoginAttempts = new Map<string, { count: number; resetAt: number }>();

function getPostgresSqlState(error: unknown): string | undefined {
  let current: unknown = error;

  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== "object" || current === null) return undefined;

    const candidate = current as { code?: unknown; cause?: unknown };
    if (
      typeof candidate.code === "string" &&
      /^[0-9A-Z]{5}$/.test(candidate.code)
    ) {
      return candidate.code;
    }

    current = candidate.cause;
  }

  return undefined;
}

function getClientKey(request: Request): string {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function getRateLimitEntry(key: string): { count: number; resetAt: number } {
  const now = Date.now();
  const existing = failedLoginAttempts.get(key);
  if (existing && existing.resetAt > now) return existing;

  if (failedLoginAttempts.size > 1000) {
    for (const [attemptKey, entry] of failedLoginAttempts) {
      if (entry.resetAt <= now) failedLoginAttempts.delete(attemptKey);
    }
  }
  if (failedLoginAttempts.size >= 5000) {
    const oldestKey = failedLoginAttempts.keys().next().value;
    if (oldestKey) failedLoginAttempts.delete(oldestKey);
  }

  const fresh = { count: 0, resetAt: now + loginWindowMs };
  failedLoginAttempts.set(key, fresh);
  return fresh;
}

function hasSameOrigin(request: Request): boolean {
  const source = request.get("origin") ?? request.get("referer");
  const host = request.get("host");
  if (!source || !host) return false;

  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

async function getCurrentAdmin(request: Request) {
  const username = readAdminSession(request.get("cookie"));
  if (!username) return null;
  const [account] = await db
    .select()
    .from(adminAccountTable)
    .where(eq(adminAccountTable.username, username))
    .limit(1);
  return account ?? null;
}

export async function requireContentAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  if (!hasSameOrigin(request)) {
    response.status(403).json({ error: "Request origin is not allowed." });
    return;
  }

  const account = await getCurrentAdmin(request);
  if (!account) {
    response.status(401).json({ error: "Admin sign-in required." });
    return;
  }
  if (account.mustChangePassword) {
    response.status(403).json({ error: "Change the initial password first." });
    return;
  }

  next();
}

router.post(
  "/admin/images",
  requireContentAdmin,
  express.raw({
    type: (request) => {
      const contentType = request.headers["content-type"];
      return isSupportedImageContentType(
        Array.isArray(contentType) ? contentType[0] : contentType,
      );
    },
    limit: maxImageUploadBytes,
  }),
  (error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      error.type === "entity.too.large"
    ) {
      response.status(413).json({ error: "Images must be 15 MB or smaller." });
      return;
    }
    next(error);
  },
  async (request: Request, response: Response): Promise<void> => {
    const contentType = normalizeImageContentType(request.get("content-type"));
    if (!isSupportedImageContentType(contentType)) {
      response.status(415).json({ error: "Choose a JPEG, PNG, WebP, AVIF, or GIF image." });
      return;
    }
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      response.status(400).json({ error: "Choose an image to upload." });
      return;
    }

    try {
      const result = await uploadPublicSiteImage(request.body, contentType);
      response.json(UploadAdminImageResponse.parse(result));
    } catch (error) {
      const statusCode = error instanceof SupabaseStorageError ? error.statusCode : 502;
      const message =
        error instanceof SupabaseStorageError
          ? error.message
          : "Image upload failed. Check the Supabase Storage configuration and retry.";
      request.log.error({ err: error, statusCode }, "Supabase site image upload failed");
      response.status(statusCode).json({ error: message });
    }
  },
);

router.get("/site-content", async (request, response): Promise<void> => {
  let saved;
  try {
    [saved] = await db
      .select()
      .from(siteContentTable)
      .where(eq(siteContentTable.id, "main"))
      .limit(1);
  } catch (error) {
    request.log.error(
      { dbErrorCode: getPostgresSqlState(error) ?? "unavailable" },
      "Site content database read failed",
    );
    throw error;
  }

  const result = GetSiteContentResponse.parse({
    content: saved?.content ?? null,
    updatedAt: saved?.updatedAt?.toISOString() ?? null,
  });
  response.json(result);
});

router.put("/site-content", async (request, response): Promise<void> => {
  if (!hasSameOrigin(request)) {
    response.status(403).json({ error: "Request origin is not allowed." });
    return;
  }

  const account = await getCurrentAdmin(request);
  if (!account) {
    response.status(401).json({ error: "Admin sign-in required." });
    return;
  }
  if (account.mustChangePassword) {
    response.status(403).json({ error: "Change the initial password first." });
    return;
  }

  const parsed = UpdateSiteContentBody.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.message });
    return;
  }

  const [saved] = await db
    .insert(siteContentTable)
    .values({
      id: "main",
      content: parsed.data.content as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: siteContentTable.id,
      set: {
        content: parsed.data.content as Record<string, unknown>,
        updatedAt: new Date(),
      },
    })
    .returning();

  const result = UpdateSiteContentResponse.parse({
    content: saved.content,
    updatedAt: saved.updatedAt.toISOString(),
  });
  request.log.info("Public website content updated");
  response.json(result);
});

router.get("/admin/status", async (request, response): Promise<void> => {
  const account = await getCurrentAdmin(request);
  response.json(
    GetAdminStatusResponse.parse({
      authenticated: !!account,
      username: account?.username ?? null,
      mustChangePassword: account?.mustChangePassword ?? false,
    }),
  );
});

router.post("/admin/login", async (request, response): Promise<void> => {
  if (!hasSameOrigin(request)) {
    response.status(403).json({ error: "Request origin is not allowed." });
    return;
  }

  const key = getClientKey(request);
  const attempts = getRateLimitEntry(key);
  if (attempts.count >= loginLimit) {
    response.setHeader(
      "Retry-After",
      Math.max(1, Math.ceil((attempts.resetAt - Date.now()) / 1000)),
    );
    response.status(429).json({ error: "Too many sign-in attempts. Try again later." });
    return;
  }

  const parsed = LoginAdminBody.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  let [account] = await db
    .select()
    .from(adminAccountTable)
    .where(eq(adminAccountTable.username, username))
    .limit(1);

  if (!account) {
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (!initialPassword) {
      response.status(503).json({ error: "Admin password setup is incomplete." });
      return;
    }
    if (
      username !== ADMIN_USERNAME ||
      !constantTimeStringEqual(password, initialPassword)
    ) {
      attempts.count += 1;
      request.log.warn("Failed admin sign-in");
      response.status(401).json({ error: "Username or password is incorrect." });
      return;
    }

    const passwordHash = await hashAdminPassword(password);
    await db
      .insert(adminAccountTable)
      .values({ username: ADMIN_USERNAME, passwordHash, mustChangePassword: true })
      .onConflictDoNothing();
    [account] = await db
      .select()
      .from(adminAccountTable)
      .where(eq(adminAccountTable.username, ADMIN_USERNAME))
      .limit(1);
  }

  if (
    !account ||
    username !== ADMIN_USERNAME ||
    !(await verifyAdminPassword(password, account.passwordHash))
  ) {
    attempts.count += 1;
    request.log.warn("Failed admin sign-in");
    response.status(401).json({ error: "Username or password is incorrect." });
    return;
  }

  failedLoginAttempts.delete(key);
  setAdminSessionCookie(response, account.username);
  response.json(
    LoginAdminResponse.parse({
      authenticated: true,
      username: account.username,
      mustChangePassword: account.mustChangePassword,
    }),
  );
});

router.post("/admin/logout", async (request, response): Promise<void> => {
  if (!hasSameOrigin(request)) {
    response.status(403).json({ error: "Request origin is not allowed." });
    return;
  }
  clearAdminSessionCookie(response);
  response.json(LogoutAdminResponse.parse({ success: true }));
});

router.post("/admin/password", async (request, response): Promise<void> => {
  if (!hasSameOrigin(request)) {
    response.status(403).json({ error: "Request origin is not allowed." });
    return;
  }

  const account = await getCurrentAdmin(request);
  if (!account) {
    response.status(401).json({ error: "Admin sign-in required." });
    return;
  }

  const parsed = ChangeAdminPasswordBody.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.message });
    return;
  }

  const passwordHash = await hashAdminPassword(parsed.data.newPassword);
  await db
    .update(adminAccountTable)
    .set({ passwordHash, mustChangePassword: false, updatedAt: new Date() })
    .where(eq(adminAccountTable.username, account.username));

  response.json(
    ChangeAdminPasswordResponse.parse({
      authenticated: true,
      username: account.username,
      mustChangePassword: false,
    }),
  );
});

export default router;