import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { eq } from "drizzle-orm";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";
import {
  ConnectAdminMailboxBody,
  SendAdminMailboxMessageBody,
} from "@workspace/api-zod";
import { adminMailboxTable, db } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import { requireContentAdmin } from "./site-content";

const router: IRouter = Router();
const singletonId = "primary";

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required to protect mailbox credentials.");
  return createHmac("sha256", secret).update("catus-admin-mailbox-v1").digest();
}

function encryptPassword(password: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

function decryptPassword(value: string) {
  const [version, iv, tag, ciphertext] = value.split(".");
  if (version !== "v1" || !iv || !tag || !ciphertext) throw new Error("Stored mailbox credentials are invalid.");
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

function status(record: typeof adminMailboxTable.$inferSelect | undefined) {
  return {
    connected: Boolean(record),
    email: record?.email ?? null,
    imapHost: record?.imapHost ?? null,
    imapPort: record?.imapPort ?? null,
    smtpHost: record?.smtpHost ?? null,
    smtpPort: record?.smtpPort ?? null,
    connectedAt: record?.connectedAt?.toISOString() ?? null,
  };
}

async function getMailbox() {
  const [record] = await db.select().from(adminMailboxTable).where(eq(adminMailboxTable.id, singletonId)).limit(1);
  if (!record) throw new Error("NO_MAILBOX");
  return { record, password: decryptPassword(record.encryptedPassword) };
}

function isPublicAddress(address: string) {
  const normalized = address.toLowerCase().split("%")[0];
  if (isIP(normalized) === 4) {
    const [a, b] = normalized.split(".").map(Number);
    return !(
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 198 && (b === 18 || b === 19 || b === 51)) ||
      (a === 203 && b === 0)
    );
  }
  if (isIP(normalized) === 6) {
    if (normalized.startsWith("::ffff:")) return isPublicAddress(normalized.slice(7));
    return /^[23]/.test(normalized) && !normalized.startsWith("2001:db8");
  }
  return false;
}

async function publicMailHost(host: string) {
  const normalized = host.trim().toLowerCase().replace(/\.$/, "");
  if (normalized.length > 253 || normalized.includes("://") || normalized.includes("/") ||
      normalized === "localhost" || normalized.endsWith(".localhost") || normalized.endsWith(".local") || normalized.endsWith(".internal") ||
      isIP(normalized) || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(normalized)) {
    throw new Error("Enter a valid public mail-server hostname.");
  }
  const addresses = await lookup(normalized, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error("The mail-server hostname must resolve to a public address.");
  }
  return normalized;
}

function imapClient(record: typeof adminMailboxTable.$inferSelect, password: string) {
  return new ImapFlow({
    host: record.imapHost,
    port: record.imapPort,
    secure: record.imapPort === 993,
    auth: { user: record.email, pass: password },
    logger: false,
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
  });
}

function smtpClient(record: typeof adminMailboxTable.$inferSelect, password: string) {
  return nodemailer.createTransport({
    host: record.smtpHost,
    port: record.smtpPort,
    secure: record.smtpPort === 465,
    requireTLS: record.smtpPort === 587,
    auth: { user: record.email, pass: password },
    connectionTimeout: 12_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
  });
}

function addressOf(addresses: Array<{ address?: string; name?: string }> | undefined) {
  const first = addresses?.[0];
  return first?.address ?? "";
}

function addressList(value: unknown): Array<{ address?: string; name?: string }> {
  if (Array.isArray(value)) return value as Array<{ address?: string; name?: string }>;
  if (typeof value === "object" && value !== null && "value" in value) {
    const nested = (value as { value?: unknown }).value;
    if (Array.isArray(nested)) return nested as Array<{ address?: string; name?: string }>;
  }
  return [];
}

function isoDate(value: Date | string | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function previewText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 180);
}

function failure(res: Response, error: unknown) {
  if (error instanceof Error && error.message === "NO_MAILBOX") {
    return res.status(503).json({ message: "Connect the company mailbox first." });
  }
  console.error("Admin mailbox operation failed:", error instanceof Error ? error.message : "unknown error");
  return res.status(502).json({ message: "The mail server could not complete this request. Check the connection settings and try again." });
}

router.get("/admin/mailbox", requireContentAdmin, async (req: Request, res: Response) => {
  try {
    const [record] = await db.select().from(adminMailboxTable).where(eq(adminMailboxTable.id, singletonId)).limit(1);
    return res.json(status(record));
  } catch (error) {
    return failure(res, error);
  }
});

router.post("/admin/mailbox", requireContentAdmin, async (req: Request, res: Response) => {
  const parsed = ConnectAdminMailboxBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Check the email address and server settings." });
  const input = parsed.data;
  try {
    const email = input.email.trim().toLowerCase();
    const imapHost = await publicMailHost(input.imapHost);
    const smtpHost = await publicMailHost(input.smtpHost);
    const record = {
      id: singletonId,
      email,
      imapHost,
      imapPort: input.imapPort,
      smtpHost,
      smtpPort: input.smtpPort,
      encryptedPassword: encryptPassword(input.password),
      connectedAt: new Date(),
      updatedAt: new Date(),
    };
    const temporary = { ...record, encryptedPassword: record.encryptedPassword };
    const imap = imapClient(temporary, input.password);
    try {
      await imap.connect();
      await imap.mailboxOpen("INBOX");
    } finally {
      if (imap.usable) await imap.logout().catch(() => undefined);
    }
    const smtp = smtpClient(temporary, input.password);
    await smtp.verify();
    await db.insert(adminMailboxTable).values(record).onConflictDoUpdate({
      target: adminMailboxTable.id,
      set: {
        email, imapHost, imapPort: input.imapPort, smtpHost, smtpPort: input.smtpPort,
        encryptedPassword: record.encryptedPassword, connectedAt: record.connectedAt, updatedAt: record.updatedAt,
      },
    });
    return res.json(status(record));
  } catch (error) {
    return failure(res, error);
  }
});

router.delete("/admin/mailbox", requireContentAdmin, async (req: Request, res: Response) => {
  try {
    await db.delete(adminMailboxTable).where(eq(adminMailboxTable.id, singletonId));
    return res.json({ success: true });
  } catch (error) {
    return failure(res, error);
  }
});

router.get("/admin/mailbox/messages", requireContentAdmin, async (req: Request, res: Response) => {
  try {
    const { record, password } = await getMailbox();
    const rawLimit = Number(req.query.limit ?? 30);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(50, Math.floor(rawLimit))) : 30;
    const client = imapClient(record, password);
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    const messages = [];
    try {
      const mailbox = client.mailbox;
      const total = mailbox && typeof mailbox === "object" ? mailbox.exists : 0;
      const start = Math.max(1, total - limit + 1);
      for await (const item of client.fetch(`${start}:*`, { uid: true, source: true, flags: true, internalDate: true }, { uid: true })) {
        const parsed = await simpleParser(item.source ?? Buffer.alloc(0));
        const body = parsed.text || (parsed.html ? parsed.html.replace(/<[^>]+>/g, " ") : "");
        messages.push({
          uid: item.uid,
          from: addressOf(addressList(parsed.from)),
          fromName: addressList(parsed.from)[0]?.name ?? null,
          to: addressOf(addressList(parsed.to)),
          subject: parsed.subject ?? "(no subject)",
          date: isoDate(parsed.date ?? item.internalDate),
          preview: previewText(body),
          unread: !item.flags?.has("\\Seen"),
        });
      }
    } finally {
      lock.release();
      await client.logout().catch(() => undefined);
    }
    return res.json({ connected: true, email: record.email, messages: messages.reverse() });
  } catch (error) {
    return failure(res, error);
  }
});

router.get("/admin/mailbox/messages/:uid", requireContentAdmin, async (req: Request, res: Response) => {
  const uid = Number(req.params.uid);
  if (!Number.isInteger(uid) || uid < 1) return res.status(400).json({ message: "Invalid message ID." });
  try {
    const { record, password } = await getMailbox();
    const client = imapClient(record, password);
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const item = await client.fetchOne(String(uid), { uid: true, source: true, flags: true, internalDate: true }, { uid: true });
      if (!item) return res.status(404).json({ message: "Message not found." });
      const parsed = await simpleParser(item.source ?? Buffer.alloc(0));
      const bodyText = (parsed.text || (parsed.html ? parsed.html.replace(/<[^>]+>/g, " ") : "")).trim().slice(0, 30000);
      return res.json({ message: {
        uid: item.uid, from: addressOf(addressList(parsed.from)), fromName: addressList(parsed.from)[0]?.name ?? null,
        to: addressOf(addressList(parsed.to)), subject: parsed.subject ?? "(no subject)",
        date: isoDate(parsed.date ?? item.internalDate),
        preview: previewText(bodyText), unread: !item.flags?.has("\\Seen"),
        bodyText, messageId: parsed.messageId ?? null,
      } });
    } finally {
      lock.release();
      await client.logout().catch(() => undefined);
    }
  } catch (error) {
    return failure(res, error);
  }
});

router.post("/admin/mailbox/send", requireContentAdmin, async (req: Request, res: Response) => {
  const parsedInput = SendAdminMailboxMessageBody.safeParse(req.body);
  if (!parsedInput.success) return res.status(400).json({ message: "Check the recipient, subject, and message." });
  try {
    const { record, password } = await getMailbox();
    const input = parsedInput.data;
    let to = input.to.trim();
    let subject = input.subject.trim();
    const options: { inReplyTo?: string; references?: string | string[] } = {};
    if (input.replyToUid) {
      const client = imapClient(record, password);
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        const original = await client.fetchOne(String(input.replyToUid), { uid: true, source: true }, { uid: true });
        if (!original) return res.status(404).json({ message: "The message being replied to no longer exists." });
        const email = await simpleParser(original.source ?? Buffer.alloc(0));
        to = addressOf(addressList(email.from));
        if (!to) return res.status(400).json({ message: "The original message has no reply address." });
        if (!/^re:/i.test(subject)) subject = `Re: ${email.subject ?? ""}`.trim();
        if (email.messageId) options.inReplyTo = email.messageId;
        if (email.references) options.references = email.references;
      } finally {
        lock.release();
        await client.logout().catch(() => undefined);
      }
    }
    const transport = smtpClient(record, password);
    await transport.sendMail({
      from: { name: "Catus Synergy", address: record.email },
      to, subject, text: input.text.trim(),
      ...options,
    });
    return res.json({ success: true, recipient: to, sentAt: new Date().toISOString() });
  } catch (error) {
    return failure(res, error);
  }
});

export default router;
