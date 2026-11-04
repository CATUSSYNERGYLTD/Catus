import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const adminMailboxTable = pgTable("catus_admin_mailbox", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  imapHost: text("imap_host").notNull(),
  imapPort: integer("imap_port").notNull(),
  smtpHost: text("smtp_host").notNull(),
  smtpPort: integer("smtp_port").notNull(),
  encryptedPassword: text("encrypted_password").notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}).enableRLS();

export type AdminMailboxRecord = typeof adminMailboxTable.$inferSelect;
