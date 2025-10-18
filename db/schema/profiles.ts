import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const profileRoleEnum = pgEnum("profile_role", [
  "master",
  "editor",
  "user",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: profileRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
