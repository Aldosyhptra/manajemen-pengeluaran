import { describe, it, expect } from "vitest";
import { formatRupiah, formatKkal, formatTanggalWIB, formatTanggalISO_WIB, formatJamWIB } from "./format";

describe("formatRupiah", () => {
  it("18000 -> Rp18.000", () => {
    expect(formatRupiah(18000)).toBe("Rp18.000");
  });
  it("150000 -> Rp150.000", () => {
    expect(formatRupiah(150000)).toBe("Rp150.000");
  });
  it("0 -> Rp0", () => {
    expect(formatRupiah(0)).toBe("Rp0");
  });
  it("pembulatan 1850.6 -> Rp1.851", () => {
    expect(formatRupiah(1850.6)).toBe("Rp1.851");
  });
  it("50000000 -> Rp50.000.000", () => {
    expect(formatRupiah(50000000)).toBe("Rp50.000.000");
  });
});

describe("formatKkal", () => {
  it("1850 -> 1.850 kkal", () => {
    expect(formatKkal(1850)).toBe("1.850 kkal");
  });
  it("0 -> 0 kkal", () => {
    expect(formatKkal(0)).toBe("0 kkal");
  });
  it("pembulatan 1850.4 -> 1.850 kkal", () => {
    expect(formatKkal(1850.4)).toBe("1.850 kkal");
  });
});

describe("formatTanggalWIB", () => {
  it("2026-10-03T00:00:00Z -> 3 Okt 2026 WIB", () => {
    // 2026-10-03 07:00 WIB
    const iso = "2026-10-03T00:00:00.000Z";
    const out = formatTanggalWIB(iso, { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
    expect(out).toMatch(/03/);
    expect(out).toMatch(/Okt|Oct/);
    expect(out).toMatch(/2026/);
  });
  it("formatTanggalISO_WIB konsisten YYYY-MM-DD", () => {
    const d = new Date("2026-10-03T00:00:00.000Z");
    const iso = formatTanggalISO_WIB(d);
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(iso).toBe("2026-10-03");
  });
});

describe("formatJamWIB", () => {
  it("2026-10-03T05:30:00Z -> 12:30 WIB", () => {
    const iso = "2026-10-03T05:30:00.000Z";
    expect(formatJamWIB(iso)).toBe("12.30");
  });
});
