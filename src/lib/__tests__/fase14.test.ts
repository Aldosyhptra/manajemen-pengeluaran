import { describe, it, expect } from "vitest";
import { buatRingkasan } from "@/lib/ringkasan";
import { ukuranHurufSchema } from "@/lib/schemas";
import { formatAngka, formatRupiah } from "@/lib/format";

describe("Fase 14 — buatRingkasan", () => {
  it("0 catatan -> Belum ada catatan hari ini", () => {
    expect(buatRingkasan({ panggilan: "Ibu", jumlahCatatan: 0, spending: 0, budget: 150000, calories: 0, calorieTarget: 2000 })).toBe(
      "Belum ada catatan hari ini. Sentuh Catat untuk memulai."
    );
  });
  it("spending <= budget sisa", () => {
    const s = buatRingkasan({ panggilan: "Ibu", jumlahCatatan: 1, spending: 58000, budget: 150000, calories: 1200, calorieTarget: 2000 });
    expect(s).toContain("Hari ini Ibu sudah mengeluarkan Rp58.000. Sisa uang belanja Rp92.000.");
    expect(s).toContain("Kalori hari ini sekitar 1.200 dari batas 2.000.");
  });
  it("spending > budget lebih", () => {
    const s = buatRingkasan({ panggilan: "Ibu", jumlahCatatan: 2, spending: 160000, budget: 150000, calories: 2300, calorieTarget: 2000 });
    expect(s).toContain("Hari ini Ibu sudah mengeluarkan Rp160.000, lebih Rp10.000 dari uang belanja.");
    expect(s).toContain("Kalori hari ini sekitar 2.300, lebih sekitar 300 dari batas 2.000.");
  });
  it("spending == budget sisa 0", () => {
    const s = buatRingkasan({ panggilan: "Atmin", jumlahCatatan: 1, spending: 150000, budget: 150000, calories: 2000, calorieTarget: 2000 });
    expect(s).toContain("Sisa uang belanja Rp0.");
    expect(s).toContain("Kalori hari ini sekitar 2.000 dari batas 2.000.");
  });
  it("nilai 0 dan panggilan berbeda", () => {
    const s = buatRingkasan({ panggilan: "Budi", jumlahCatatan: 1, spending: 0, budget: 100000, calories: 0, calorieTarget: 1800 });
    expect(s).toContain("Hari ini Budi sudah mengeluarkan Rp0.");
    expect(s).toContain("Sisa uang belanja Rp100.000.");
    expect(s).toContain("Kalori hari ini sekitar 0 dari batas 1.800.");
  });
  it("nada netral tanpa seru/boros", () => {
    const s = buatRingkasan({ panggilan: "Ibu", jumlahCatatan: 1, spending: 300000, budget: 100000, calories: 5000, calorieTarget: 1500 });
    expect(s).not.toMatch(/boros|berlebihan|bahaya|terlalu|!/i);
  });
  it("max 2 kalimat untuk non-0 (uang + kalori)", () => {
    const s = buatRingkasan({ panggilan: "Ibu", jumlahCatatan: 1, spending: 50000, budget: 100000, calories: 1000, calorieTarget: 2000 });
    // Rp memakai titik ribuan, jadi hitung kalimat via ". " + akhir titik
    const sentences = s.split(/\.\s+/).filter(Boolean);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    expect(sentences.length).toBeLessThanOrEqual(3);
    expect(s.endsWith(".")).toBe(true);
  });
});

describe("Fase 14 — ukuranHurufSchema", () => {
  it("accept normal/besar/sangat_besar", () => {
    expect(ukuranHurufSchema.safeParse("normal").success).toBe(true);
    expect(ukuranHurufSchema.safeParse("besar").success).toBe(true);
    expect(ukuranHurufSchema.safeParse("sangat_besar").success).toBe(true);
  });
  it("reject lain", () => {
    expect(ukuranHurufSchema.safeParse("kecil").success).toBe(false);
    expect(ukuranHurufSchema.safeParse("").success).toBe(false);
  });
});

describe("Fase 14 — formatAngka", () => {
  it("format id-ID", () => {
    expect(formatAngka(1200)).toBe("1.200");
    expect(formatAngka(2000)).toBe("2.000");
    expect(formatRupiah(58000)).toBe("Rp58.000");
  });
});
