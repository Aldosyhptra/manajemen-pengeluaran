import { describe, it, expect } from "vitest";
import { Pool } from "pg";
import { getSeringDibeli } from "@/lib/data/sering-dibeli";
import { bentukTeksCepat } from "@/lib/sering";

const A = "1000000001";
const B = "web-ibu";
const adminPool = new Pool({ connectionString: "postgresql://postgres:dev_only_password@localhost:5433/pengeluaran_dev", max: 1 });

describe("Fase 15 — bentukTeksCepat", () => {
  it("format Rp", () => {
    expect(bentukTeksCepat("es teh", 5000)).toBe("es teh Rp5.000");
    expect(bentukTeksCepat("kopi susu", 18000)).toBe("kopi susu Rp18.000");
  });
  it("nama panjang tidak dipotong pada teks yang diisi", () => {
    const long = "a".repeat(60);
    expect(bentukTeksCepat(long, 1000)).toBe(`${long} Rp1.000`);
    expect(bentukTeksCepat(long, 1000).length).toBeGreaterThan(40);
  });
});

describe("Fase 15 — getSeringDibeli isolasi & aturan", () => {
  it("admin memuat es teh/kopi susu/bensin, tidak memuat milik ibu", async () => {
    const a = await getSeringDibeli(A);
    const names = a.map((x) => x.nama);
    // seed: admin punya es teh 4x, kopi susu 2x, bensin 2x dalam 90 hari
    expect(names).toContain("es teh");
    expect(names).toContain("kopi susu");
    expect(names).toContain("bensin");
    expect(names).not.toContain("sayur di pasar");
    expect(names).not.toContain("bakso");
  });
  it("ibu memuat sayur di pasar/bakso, tidak memuat milik admin", async () => {
    const b = await getSeringDibeli(B);
    const names = b.map((x) => x.nama);
    expect(names).toContain("sayur di pasar");
    expect(names).toContain("bakso");
    expect(names).not.toContain("es teh");
    // ibu tidak punya kopi susu/bensin
    expect(names).not.toContain("kopi susu");
  });
  it("ambang minimal 2 kali — yang cuma 1x tidak muncul", async () => {
    // insert 1x item baru untuk A, harus tidak muncul
    await adminPool.query("INSERT INTO pengeluaran (chat_id, kategori, deskripsi, nominal) VALUES ($1,'lainnya','sekali saja', 9999)", [A]);
    const a = await getSeringDibeli(A);
    const found = a.find((x) => x.nama === "sekali saja");
    expect(found).toBeUndefined();
    await adminPool.query("DELETE FROM pengeluaran WHERE chat_id=$1 AND deskripsi='sekali saja'", [A]);
  });
  it("harga yang diisi adalah harga terbaru", async () => {
    const a = await getSeringDibeli(A);
    const es = a.find((x) => x.nama === "es teh");
    expect(es?.nominal_terakhir).toBe(5000); // terakhir 5000 (seed 15:10), bukan 6000
    const b = await getSeringDibeli(B);
    const sayur = b.find((x) => x.nama === "sayur di pasar");
    expect(sayur?.nominal_terakhir).toBe(45000); // 06:30 terbaru
  });
  it("batas 6", async () => {
    // tambah 10 item unik 2x untuk A agar melebihi 6
    for (let i = 0; i < 10; i++) {
      await adminPool.query("INSERT INTO pengeluaran (chat_id, kategori, deskripsi, nominal) VALUES ($1,'lainnya',$2, 1000), ($1,'lainnya',$2, 1000)", [A, `item${i}`]);
    }
    const a = await getSeringDibeli(A);
    expect(a.length).toBeLessThanOrEqual(6);
    for (let i = 0; i < 10; i++) {
      await adminPool.query("DELETE FROM pengeluaran WHERE chat_id=$1 AND deskripsi=$2", [A, `item${i}`]);
    }
  });
});

describe("Fase 15 — manifest & no SW", () => {
  it("manifest valid", async () => {
    const mod = await import("@/app/manifest");
    const m = mod.default();
    expect(m.name).toBe("Catatan Pengeluaran & Kalori");
    expect(m.short_name).toBe("Catatan");
    expect(m.start_url).toBe("/");
    expect((m.display as string)).toBe("standalone");
    expect(Array.isArray(m.icons)).toBe(true);
    expect(m.icons!.length).toBeGreaterThanOrEqual(3);
  });
  it("tidak ada serviceWorker di src", async () => {
    const { execSync } = await import("node:child_process");
    const out = execSync("grep -r \"serviceWorker\|navigator.serviceWorker\" src --include=\"*.ts\" --include=\"*.tsx\" || true", { encoding: "utf-8" });
    expect(out.trim()).toBe("");
  });
});
