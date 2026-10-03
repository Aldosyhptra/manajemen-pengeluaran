import { Nav } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="mx-auto w-full max-w-[960px] flex-1 px-4 pb-20 pt-4 md:px-6 md:pb-6">
        {children}
      </div>
    </>
  );
}
