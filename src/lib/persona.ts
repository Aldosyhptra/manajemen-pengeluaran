export const DEFAULT_PERSONA =
  "Gaya bicara: sopan, ramah, dan menenangkan, memakai bahasa Indonesia baku yang hangat.\nBalasan singkat dan jelas, tanpa candaan berlebihan, maksimal 1 emoji.\nJika kalori melebihi target, ingatkan dengan lembut dan sarankan jalan santai.\nJika pengguna terlihat kesulitan keuangan, bersikaplah suportif.";

export function validatePersona(text: string): { ok: true } | { ok: false; alasan: string } {
  const t = text.trim();
  if (t.length < 40) return { ok: false, alasan: "Persona terlalu pendek (minimal 40 karakter)." };
  if (t.length > 1200) return { ok: false, alasan: "Persona terlalu panjang (maksimal 1200 karakter)." };
  // null check persona boleh 40-1500 di DB, tapi validatePersona untuk persona baru adalah 40-1200
  const patterns: RegExp[] = [
    /https?:\/\//i,
    /www\./i,
    /```/,
    /\b(select|insert|update|delete|drop|alter|truncate|union)\b/i,
    /\bchat[_ ]?id\b/i,
    /\b(database|tabel|query|tool|prompt)\b/i,
    /\b(kategori|nominal)\b/i,
  ];
  for (const p of patterns) {
    if (p.test(t)) return { ok: false, alasan: "Persona mengandung kata atau pola yang tidak diperbolehkan." };
  }
  if (/(abaikan|lupakan|ignore|disregard|override|timpa).{0,40}(aturan|instruksi|perintah|rules|instruction)/i.test(t)) {
    return { ok: false, alasan: "Persona mengandung instruksi yang tidak diperbolehkan." };
  }
  // cegah URL-like tanpa scheme yang lolos, sudah cover www. dan http
  return { ok: true };
}
