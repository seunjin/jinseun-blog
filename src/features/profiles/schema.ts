import { profileRoleEnum, profiles } from "@db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const profileRowSchema = createSelectSchema(profiles);
export const profileRoleSchema = z.enum(profileRoleEnum.enumValues);

//일반 프로필 수정
export const upsertProfileSchema = createInsertSchema(profiles, {
  email: z.email("이메일 형식을 확인하세요."),
  name: z.string().min(1, "이름은 필수입니다."),
});

export type ProfileRow = typeof profiles.$inferSelect;
export type UpsertProfileInput = typeof profiles.$inferInsert;
