import { describe, it, expect } from "vitest";
import { Pool } from "pg";
import { pool } from "@/lib/db";
import { pengeluaranEditSchema, kaloriEditSchema, idCatatanSchema, isPerubahanBesar } from "@/lib/schemas";
import { updatePengeluaran, deletePengeluaran, deleteKalori, getPengeluaranById } from "@/lib/data/catatan";

const A = "1000000001";
const B = "web-ibu";

// Koneksi postgres (superuser lokal) hanya untuk setup/cleanup yang memang tidak boleh lewat app_web
const adminPool = new Pool({ connectionString: "postgresql://postgres:dev_only_password@localhost:5433/pengeluaran_dev", max: 1 });

async function getOneId(chatId: string, table: "pengeluaran" | "kalori"): Promise<string> {
  const r = await pool.query(`SELECT id::text AS id FROM ${table} WHERE chat_id = $1 ORDER BY id LIMIT 1`, [chatId]);
  if (r.rows.length === 0) throw new Error(`no row in ${table} for ${chatId}`);
  return String(r.rows[0].id);
}

describe("Fase 13 - Zod validasi", () => {
  it("idCatatanSchema menolak non-digit dan >18", () => {
    expect(idCatatanSchema.safeParse("123").success).toBe(true);
    expect(idCatatanSchema.safeParse("abc").success).toBe(false);
    expect(idCatatanSchema.safeParse("").success).toBe(false);
    expect(idCatatanSchema.safeParse("1234567890123456789").success).toBe(false); // 19
    expect(idCatatanSchema.safeParse("123456789012345678").success).toBe(true); // 18
  });
  it("pengeluaranEditSchema menolak nominal di luar 1-50jt dan kategori salah", () => {
    expect(pengeluaranEditSchema.safeParse({ id: "1", kategori: "makanan", deskripsi: "kopi", nominal: 0 }).success).toBe(false);
    expect(pengeluaranEditSchema.safeParse({ id: "1", kategori: "makanan", deskripsi: "kopi", nominal: 1 }).success).toBe(true);
    expect(pengeluaranEditSchema.safeParse({ id: "1", kategori: "makanan", deskripsi: "kopi", nominal: 50000000 }).success).toBe(true);
    expect(pengeluaranEditSchema.safeParse({ id: "1", kategori: "makanan", deskripsi: "kopi", nominal: 50000001 }).success).toBe(false);
    expect(pengeluaranEditSchema.safeParse({ id: "1", kategori: "salah" as never, deskripsi: "kopi", nominal: 1000 }).success).toBe(false);
    expect(pengeluaranEditSchema.safeParse({ id: "1", kategori: "makanan", deskripsi: "   ", nominal: 1000 }).success).toBe(false);
    expect(pengeluaranEditSchema.safeParse({ id: "1", kategori: "makanan", deskripsi: "a".repeat(101), nominal: 1000 }).success).toBe(false);
  });
  it("kaloriEditSchema menolak kkal di luar 0-5000", () => {
    expect(kaloriEditSchema.safeParse({ id: "1", nama_makanan: "nasi", estimasi_kalori: -1 }).success).toBe(false);
    expect(kaloriEditSchema.safeParse({ id: "1", nama_makanan: "nasi", estimasi_kalori: 0 }).success).toBe(true);
    expect(kaloriEditSchema.safeParse({ id: "1", nama_makanan: "nasi", estimasi_kalori: 5000 }).success).toBe(true);
    expect(kaloriEditSchema.safeParse({ id: "1", nama_makanan: "nasi", estimasi_kalori: 5001 }).success).toBe(false);
  });
  it("isPerubahanBesar 10x dan 1/10", () => {
    expect(isPerubahanBesar(5000, 50000)).toBe(true);
    expect(isPerubahanBesar(50000, 5000)).toBe(true);
    expect(isPerubahanBesar(10000, 99999)).toBe(false);
    expect(isPerubahanBesar(10000, 100000)).toBe(true);
    expect(isPerubahanBesar(10000, 1000)).toBe(true);
    expect(isPerubahanBesar(10000, 1001)).toBe(false);
    expect(isPerubahanBesar(0, 100)).toBe(false);
    expect(isPerubahanBesar(100, 0)).toBe(false);
  });
});

describe("Fase 13 - isolasi tulis dan arsip", () => {
  it("A tidak bisa ubah baris milik B (0 row, simulasi 404)", async () => {
    const idB = await getOneId(B, "pengeluaran");
    const n = await updatePengeluaran(A, idB, { kategori: "makanan", deskripsi: "coba hack", nominal: 9999 });
    expect(n).toBe(0);
    const row = await pool.query("SELECT deskripsi FROM pengeluaran WHERE id = $1::bigint", [idB]);
    expect(String(row.rows[0].deskripsi)).not.toBe("coba hack");
  });
  it("A tidak bisa hapus baris milik B (0 arsip)", async () => {
    const idB = await getOneId(B, "pengeluaran");
    const before = await adminPool.query("SELECT count(*)::int AS n FROM catatan_dihapus WHERE chat_id = $1", [A]);
    const n = await deletePengeluaran(A, idB);
    expect(n).toBe(0);
    const after = await adminPool.query("SELECT count(*)::int AS n FROM catatan_dihapus WHERE chat_id = $1", [A]);
    expect(Number(after.rows[0].n)).toBe(Number(before.rows[0].n));
    const still = await pool.query("SELECT id FROM pengeluaran WHERE id = $1::bigint AND chat_id = $2", [idB, B]);
    expect(still.rows.length).toBe(1);
  });
  it("update menyimpan deskripsi lower-case", async () => {
    const idA = await getOneId(A, "pengeluaran");
    const orig = await getPengeluaranById(A, idA);
    expect(orig).not.toBeNull();
    const newDesc = "KOPI SUSU BESAR";
    const n = await updatePengeluaran(A, idA, { kategori: orig!.kategori, deskripsi: newDesc, nominal: orig!.nominal });
    expect(n).toBe(1);
    const after = await getPengeluaranById(A, idA);
    expect(after!.deskripsi).toBe(newDesc.toLowerCase());
    await updatePengeluaran(A, idA, { kategori: orig!.kategori, deskripsi: orig!.deskripsi, nominal: orig!.nominal });
  });
  it("hapus pengeluaran mengarsip atomik ke catatan_dihapus", async () => {
    const ins = await adminPool.query(
      `INSERT INTO pengeluaran (chat_id, tanggal, kategori, deskripsi, nominal) VALUES ($1, now(), 'lainnya', 'hapus-test-fase13', 12345) RETURNING id::text AS id`,
      [A],
    );
    const tmpId = String(ins.rows[0].id);
    const before = await adminPool.query("SELECT count(*)::int AS n FROM catatan_dihapus WHERE chat_id = $1 AND jenis='pengeluaran'", [A]);
    const n = await deletePengeluaran(A, tmpId);
    expect(n).toBe(1);
    const after = await adminPool.query("SELECT count(*)::int AS n FROM catatan_dihapus WHERE chat_id = $1 AND jenis='pengeluaran'", [A]);
    expect(Number(after.rows[0].n)).toBeGreaterThan(Number(before.rows[0].n));
    const arch = await adminPool.query("SELECT data FROM catatan_dihapus WHERE chat_id = $1 AND jenis='pengeluaran' ORDER BY dihapus_pada DESC LIMIT 1", [A]);
    expect(String(arch.rows[0].data.deskripsi)).toBe("hapus-test-fase13");
    const gone = await adminPool.query("SELECT id FROM pengeluaran WHERE id = $1::bigint", [tmpId]);
    expect(gone.rows.length).toBe(0);
    await adminPool.query("DELETE FROM catatan_dihapus WHERE chat_id = $1 AND data->>'deskripsi' = 'hapus-test-fase13'", [A]);
  });
  it("hapus kalori mengarsip dengan jenis kalori", async () => {
    const ins = await adminPool.query(
      `INSERT INTO kalori (chat_id, tanggal, nama_makanan, estimasi_kalori) VALUES ($1, now(), 'hapus-kalori-fase13', 321) RETURNING id::text AS id`,
      [A],
    );
    const tmpId = String(ins.rows[0].id);
    const n = await deleteKalori(A, tmpId);
    expect(n).toBe(1);
    const arch = await adminPool.query("SELECT jenis, data FROM catatan_dihapus WHERE chat_id = $1 ORDER BY dihapus_pada DESC LIMIT 1", [A]);
    expect(arch.rows[0].jenis).toBe("kalori");
    expect(String(arch.rows[0].data.nama_makanan)).toBe("hapus-kalori-fase13");
    await adminPool.query("DELETE FROM catatan_dihapus WHERE chat_id = $1 AND data->>'nama_makanan' = 'hapus-kalori-fase13'", [A]);
  });
  it("app_web tidak boleh UPDATE chat_id atau tanggal (ditolak DB)", async () => {
    const idA = await getOneId(A, "pengeluaran");
    await expect(pool.query("UPDATE pengeluaran SET chat_id = $2 WHERE id = $1::bigint", [idA, "hacked"])).rejects.toThrow();
    await expect(pool.query("UPDATE pengeluaran SET tanggal = now() WHERE id = $1::bigint", [idA])).rejects.toThrow();
    await expect(pool.query("UPDATE kalori SET chat_id = $2 WHERE id = $1::bigint", [await getOneId(A, "kalori"), "hacked"])).rejects.toThrow();
  });
  it("app_web tidak punya INSERT ke pengeluaran/kalori", async () => {
    await expect(
      pool.query("INSERT INTO pengeluaran (chat_id, tanggal, kategori, deskripsi, nominal) VALUES ($1, now(), 'makanan', 'hack', 1000)", [A]),
    ).rejects.toThrow();
  });
});
