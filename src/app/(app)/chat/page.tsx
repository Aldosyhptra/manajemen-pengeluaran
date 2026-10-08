import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getChatHistory } from "@/lib/data/chat";
import { ChatUI } from "@/components/ChatUI";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/chat");
  if (user.wajibGantiPassword) redirect("/ganti-password");
  const initialMessages = await getChatHistory(user.id);
  return (
    <main>
      <h1 className="font-heading text-2xl font-bold text-tinta">Catat</h1>
      <p className="mt-1 text-sm text-tinta-redup">
        Tulis pengeluaran atau makanan. Kalori dicatat sebagai perkiraan.
      </p>
      <div className="mt-4">
        <ChatUI initialMessages={initialMessages} />
      </div>
    </main>
  );
}
