import {
  boolean,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "volunteer", "team_leader"]);
export const movementTypeEnum = pgEnum("movement_type", ["entry", "withdrawal"]);
export const serviceTimeEnum = pgEnum("service_time", ["08:30", "11:00", "17:00", "19:30"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  openId: text("open_id").unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("login_method").default("access_code").notNull(),
  role: userRoleEnum("role").default("volunteer").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const units = pgTable("units", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: uuid("category_id").notNull(),
  unitId: uuid("unit_id").notNull(),
  currentQuantity: numeric("current_quantity", { precision: 12, scale: 2 }).default("0").notNull(),
  minimumStock: numeric("minimum_stock", { precision: 12, scale: 2 }).default("0").notNull(),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }),
  maxWithdrawalLimit: numeric("max_withdrawal_limit", { precision: 12, scale: 2 }),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const movements = pgTable("movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull(),
  type: movementTypeEnum("type").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  volunteerName: text("volunteer_name"),
  teamId: uuid("team_id"),
  serviceTime: serviceTimeEnum("service_time"),
  notes: text("notes"),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

export type Unit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type Movement = typeof movements.$inferSelect;
export type InsertMovement = typeof movements.$inferInsert;
