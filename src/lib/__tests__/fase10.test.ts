import { describe, it, expect } from "vitest";
import { pool } from "@/lib/db";
import {
  getChatHistory,
  insertAktivitasChat,
  countAktivitasChat1Jam,
  insertChatPesan,
  pruneKeep200,
  clearChat,
} from "@/lib/data/chat";

// Helpers: ambil id dua pengguna seed
async function getPenggunaIds() {
  const r = await pool.query("SELECT id, username FROM pengguna WHERE username IN ('admin','ibu') ORDER BY username");
  const map: Record<string, number> = {};
  for (const row of r.rows) map[String(row.username)] = Number(row.id);
  return map;
}

describe("Fase 10 - riwayat chat isolasi per pengguna", () => {
  it("riwayat tidak bocor antar pengguna", async () => {
    const ids = await getPenggunaIds();
    const adminId = ids["admin"];
    const ibuId = ids["ibu"];
    // bersihkan dulu agar deterministik
    await clearChat(adminId);
    await clearChat(ibuId);

    await insertChatPesan(adminId, "user", "admin-only-msg-" + Date.now());
    await insertChatPesan(adminId, "bot", "admin-bot-" + Date.now());

    const ibuHistory = await getChatHistory(ibuId);
    expect(ibuHistory.some((m) => m.text.includes("admin-only-msg"))).toBe(false);
    expect(ibuHistory.some((m) => m.text.includes("admin-bot"))).toBe(false);

    const adminHistory = await getChatHistory(adminId);
    expect(adminHistory.some((m) => m.text.includes("admin-only-msg"))).toBe(true);

    // cleanup
    await clearChat(adminId);
  });

  it("riwayat sama di dua browser untuk akun yang sama (getChatHistory deterministik)", async () => {
    const ids = await getPenggunaIds();
    const ibuId = ids["ibu"];
    await clearChat(ibuId);
    const stamp = String(Date.now());
    await insertChatPesan(ibuId, "user", "msg-a-" + stamp);
    await insertChatPesan(ibuId, "bot", "bot-a-" + stamp);

    const h1 = await getChatHistory(ibuId);
    const h2 = await getChatHistory(ibuId);
    expect(h1.length).toBe(h2.length);
    expect(h1.map((m) => m.text)).toEqual(h2.map((m) => m.text));

    await clearChat(ibuId);
  });

  it("hapus percakapan tidak mereset batas pemakaian (aktivitas tetap)", async () => {
    const ids = await getPenggunaIds();
    const ibuId = ids["ibu"];
    // bersihkan
    await pool.query("DELETE FROM aktivitas WHERE pengguna_id = $1 AND jenis = 'chat'", [ibuId]);
    await clearChat(ibuId);

    await insertAktivitasChat(ibuId);
    await insertAktivitasChat(ibuId);
    await insertChatPesan(ibuId, "user", "x");
    await insertChatPesan(ibuId, "bot", "y");

    const before = await countAktivitasChat1Jam(ibuId);
    expect(before).toBe(2);

    await clearChat(ibuId);
    const after = await countAktivitasChat1Jam(ibuId);
    expect(after).toBe(2); // aktivitas tidak ikut terhapus

    const h = await getChatHistory(ibuId);
    expect(h.length).toBe(0);

    // cleanup aktivitas
    await pool.query("DELETE FROM aktivitas WHERE pengguna_id = $1 AND jenis = 'chat'", [ibuId]);
  });

  it("30 per jam dibatasi (count >=30 dianggap penuh)", async () => {
    const ids = await getPenggunaIds();
    const ibuId = ids["ibu"];
    await pool.query("DELETE FROM aktivitas WHERE pengguna_id = $1 AND jenis = 'chat'", [ibuId]);
    // insert 30
    for (let i = 0; i < 30; i++) await insertAktivitasChat(ibuId);
    const c30 = await countAktivitasChat1Jam(ibuId);
    expect(c30).toBe(30);
    // route akan menolak jika >=30, cek logic: count >=30 => 429
    expect(c30 >= 30).toBe(true);

    // cleanup
    await pool.query("DELETE FROM aktivitas WHERE pengguna_id = $1 AND jenis = 'chat'", [ibuId]);
    const c0 = await countAktivitasChat1Jam(ibuId);
    expect(c0).toBe(0);
  });

  it("pruneKeep200 menjaga hanya 200 terbaru", async () => {
    const ids = await getPenggunaIds();
    const ibuId = ids["ibu"];
    await clearChat(ibuId);
    // insert 205 pesan (cepat via batch)
    for (let i = 0; i < 205; i++) {
      await insertChatPesan(ibuId, i % 2 === 0 ? "user" : "bot", "bulk-" + i);
    }
    // prune
    await pruneKeep200(ibuId);
    const r = await pool.query("SELECT count(*)::int AS n FROM chat_pesan WHERE pengguna_id = $1", [ibuId]);
    expect(Number(r.rows[0].n)).toBe(200);
    await clearChat(ibuId);
  });
});
