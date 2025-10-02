import { fetchProfilesServer } from "@/features/profiles/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await fetchProfilesServer();
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "PROFILES_FETCH_ERROR", message: e.message ?? "..." },
      },
      { status: 500 }
    );
  }
}
