import { ChatUI } from "@/components/ChatUI";

export default function ChatPage() {
  return (
    <main>
      <h1 className="font-heading text-2xl font-bold text-tinta">Catat</h1>
      <p className="mt-1 text-sm text-tinta-redup">
        Tulis pengeluaran atau makanan. Kalori dicatat sebagai perkiraan.
      </p>
      <div className="mt-4">
        <ChatUI />
      </div>
    </main>
  );
}
