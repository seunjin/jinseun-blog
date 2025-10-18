import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

const databaseUrl = process.env.SUPABASE_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL 환경 변수가 비어 있습니다. .env.local에 값을 설정하세요.",
  );
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Drizzle CLI가 사용할 Supabase 연결 문자열 (.env.local 또는 환경 변수에서 세팅)
    url: databaseUrl,
  },
});
