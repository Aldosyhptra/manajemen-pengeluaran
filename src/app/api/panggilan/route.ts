import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { panggilanSchema } from "@/lib/schemas";
import { updatePanggilanSendiri } from "@/lib/data/pengguna";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    const r = NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sesi tidak valid. Silakan masuk lagi." } }, { status: 401 });
    r.headers.set("Cache-Control", "no-store"); return r;
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    const r = NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Format tidak valid." } }, { status: 400 });
    r.headers.set("Cache-Control", "no-store"); return r;
  }
  const panggilan = typeof (body as { panggilan?: unknown })?.panggilan === "string" ? (body as { panggilan: string }).panggilan : "";
  const parsed = panggilanSchema.safeParse(panggilan);
  if (!parsed.success) {
    const r = NextResponse.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Panggilan tidak valid." } }, { status: 400 });
    r.headers.set("Cache-Control", "no-store"); return r;
  }
  const n = await updatePanggilanSendiri(user.id, parsed.data);
  if (!n) {
    const r = NextResponse.json({ error: { code: "INTERNAL", message: "Gagal menyimpan panggilan." } }, { status: 500 });
    r.headers.set("Cache-Control", "no-store"); return r;
  }
  const res = NextResponse.json({ ok: true });
  res.headers.set("Cache-Control", "no-store"); return res;
}
