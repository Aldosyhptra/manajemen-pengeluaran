import type { Metadata } from "next"
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google"
import "./globals.css"
import { getCurrentUser } from "@/lib/auth"

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
})

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Manajemen Pengeluaran",
  description: "Pencatatan pengeluaran dan kalori harian",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let ukuran: string = "normal"
  try {
    const u = await getCurrentUser()
    if (u) {
      const { getUkuranHuruf } = await import("@/lib/data/pengguna")
      const v = await getUkuranHuruf(u.id)
      if (v === "besar" || v === "sangat_besar" || v === "normal") ukuran = v
    }
  } catch {}
  return (
    <html
      lang="id"
      data-ukuran={ukuran}
      className={`${bricolage.variable} ${hanken.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
