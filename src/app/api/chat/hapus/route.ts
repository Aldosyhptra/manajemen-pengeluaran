import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { clearChat } from "@/lib/data/chat";

export const dynamic = "force-dynamic";

export async function POST() {
  let user;
  try {
    user = await requireUser();
  } catch {
    // requireUser gagal -> sesi tidak valid
    const r = NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sesi tidak valid. Silakan masuk lagi." } }, { status: 401 });
    r.headers.set("Cache-Control", "no-store");
    return r;
  }
  await clearChat(user.id);
  const r = NextResponse.json({ ok: true });
  r.headers.set("Cache-Control", "no-store");
  return r;
}
