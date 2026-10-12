import { formatRupiah, formatAngka } from "@/lib/format";

export type RingkasanInput = {
  panggilan: string;
  jumlahCatatan: number;
  spending: number;
  budget: number;
  calories: number;
  calorieTarget: number;
};

export function buatRingkasan({ panggilan, jumlahCatatan, spending, budget, calories, calorieTarget }: RingkasanInput): string {
  if (jumlahCatatan === 0) {
    return "Belum ada catatan hari ini. Sentuh Catat untuk memulai.";
  }
  const parts: string[] = [];
  if (spending <= budget) {
    const sisa = budget - spending;
    parts.push(`Hari ini ${panggilan} sudah mengeluarkan ${formatRupiah(spending)}. Sisa uang belanja ${formatRupiah(sisa)}.`);
  } else {
    const lebih = spending - budget;
    parts.push(`Hari ini ${panggilan} sudah mengeluarkan ${formatRupiah(spending)}, lebih ${formatRupiah(lebih)} dari uang belanja.`);
  }
  if (calories <= calorieTarget) {
    parts.push(`Kalori hari ini sekitar ${formatAngka(calories)} dari batas ${formatAngka(calorieTarget)}.`);
  } else {
    const lebihKal = calories - calorieTarget;
    parts.push(`Kalori hari ini sekitar ${formatAngka(calories)}, lebih sekitar ${formatAngka(lebihKal)} dari batas ${formatAngka(calorieTarget)}.`);
  }
  return parts.join(" ");
}
