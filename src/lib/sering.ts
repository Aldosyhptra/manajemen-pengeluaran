import { formatRupiah } from "@/lib/format";
export function bentukTeksCepat(nama: string, nominal: number): string {
  return `${nama} ${formatRupiah(nominal)}`;
}
