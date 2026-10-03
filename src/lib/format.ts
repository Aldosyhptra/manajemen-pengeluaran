// Satu pintu format rupiah & tanggal (PRD 7)
export function formatRupiah(n: number): string {
  // Rp18.000 (tanpa spasi, pembulatan bulat)
  const v = Math.round(n);
  return `Rp${v.toLocaleString("id-ID")}`;
}

export function formatKkal(n: number): string {
  return `${Math.round(n).toLocaleString("id-ID")} kkal`;
}

// WIB (Asia/Jakarta) — pakai Intl, input ISO string dari Date.toISOString() server
export function formatTanggalWIB(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    ...opts,
  }).format(d);
}

export function formatTanggalISO_WIB(d = new Date()): string {
  // YYYY-MM-DD WIB untuk param $2
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
}

export function formatJamWIB(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}
