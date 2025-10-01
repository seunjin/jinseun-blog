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

// export async function GET() {
//   const supabase = await createClient();

//   const { data, error } = await supabase
//     .from("profiles")
//     .select("id, email, name, role, created_at")
//     .order("created_at", { ascending: false });

//   if (error) {
//     return NextResponse.json(
//       {
//         success: false,
//         error: {
//           code: "PROFILES_FETCH_ERROR",
//           message: "프로필 목록을 불러오지 못했습니다.",
//           details: error.message,
//         },
//       },
//       { status: 500 },
//     );
//   }

//   return NextResponse.json(
//     {
//       success: true,
//       data,
//     },
//     { status: 200 },
//   );
// }
