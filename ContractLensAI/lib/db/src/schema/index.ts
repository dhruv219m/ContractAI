import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

const auditFields = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  ...auditFields,
});

export const contractVersions = pgTable("contract_versions", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  label: text("label").notNull(),
  filename: text("filename").notNull(),
  extractedText: text("extracted_text"),
  isCurrent: boolean("is_current").default(false).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contractParties = pgTable("contract_parties", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
});

export const obligations = pgTable("obligations", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  owner: text("owner").notNull(),
  status: text("status").notNull(),
  dueDate: text("due_date").notNull(),
  recurrence: text("recurrence").notNull(),
  confidence: numeric("confidence").notNull(),
  evidence: jsonb("evidence").notNull(),
});

export const deadlines = pgTable("deadlines", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  date: text("date").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  owner: text("owner").notNull(),
  source: jsonb("source").notNull(),
});

export const reviewItems = pgTable("review_items", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  issue: text("issue").notNull(),
  reason: text("reason").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull(),
  suggestedAction: text("suggested_action").notNull(),
  evidence: jsonb("evidence").notNull(),
});

export const agentActions = pgTable("agent_actions", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  agent: text("agent").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  evidence: jsonb("evidence").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sourceEvidence = pgTable("source_evidence", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(),
  page: integer("page").notNull(),
  section: text("section").notNull(),
  excerpt: text("excerpt").notNull(),
  sourceType: text("source_type").notNull(),
});

export const insertContractSchema = createInsertSchema(contracts);
export const insertContractVersionSchema = createInsertSchema(contractVersions);
export const insertContractPartySchema = createInsertSchema(contractParties);
export const insertObligationSchema = createInsertSchema(obligations);
export const insertDeadlineSchema = createInsertSchema(deadlines);
export const insertReviewItemSchema = createInsertSchema(reviewItems);
export const insertAgentActionSchema = createInsertSchema(agentActions);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertSourceEvidenceSchema = createInsertSchema(sourceEvidence);

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;