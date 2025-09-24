"use client";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { css } from "@/styled-system/css";
import { stack } from "@/styled-system/patterns";

// 임시 로그인 페이지
// 이후 Supabase Auth UI 또는 커스텀 폼을 연결합니다.
export default function SignInPage() {
  const signInWithGoogle = async () => {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };
  return (
    <section
      className={css({
        maxWidth: "lg",
        margin: "0 auto",
        padding: { base: "8", md: "12" },
      })}
    >
      <div className={stack({ gap: "4" })}>
        <h1
          className={css({
            fontSize: { base: "2xl", md: "3xl" },
            fontWeight: "semibold",
          })}
        >
          로그인 필요
        </h1>
        <p className={css({ color: "gray.600", _dark: { color: "gray.300" } })}>
          관리자 영역에 접근하려면 로그인이 필요합니다. 인증 UI는 추후 연결할
          예정입니다.
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          className={css({
            marginTop: "4",
            paddingInline: "4",
            paddingBlock: "2",
            borderRadius: "md",
            background: "black",
            color: "white",
            _dark: { background: "white", color: "black" },
          })}
        >
          Google로 로그인
        </button>

        <Link href="/" className={css({ textDecoration: "underline" })}>
          홈으로 돌아가기
        </Link>
      </div>
    </section>
  );
}
