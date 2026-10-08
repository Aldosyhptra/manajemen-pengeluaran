import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/");
  }
  if (user.wajibGantiPassword) {
    redirect("/ganti-password");
  }
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-biru-nota focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Lewati ke konten utama
      </a>
      <Nav peran={user.peran} />
      <div id="main-content" className="mx-auto w-full max-w-[960px] flex-1 px-4 pb-20 pt-4 md:px-6 md:pb-6">
        {children}
      </div>
    </>
  );
}
