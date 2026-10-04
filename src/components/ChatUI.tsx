"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "assistant"; text: string };

const examples = ["kopi 18rb", "sarapan nasi uduk 2 telur"];

export function ChatUI() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    if (text.length > 500) {
      setError("Maksimal 500 karakter.");
      return;
    }
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { reply?: string; error?: { message: string } };
      if (!res.ok) {
        const msg = data.error?.message ?? "Tidak bisa mencatat. Coba lagi.";
        setError(msg);
        setMessages((prev) => [...prev, { role: "assistant", text: msg }]);
        return;
      }
      const reply = data.reply ?? "Tercatat.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      router.refresh();
    } catch {
      const msg = "Tidak bisa menghubungi server. Periksa koneksi, lalu coba lagi.";
      setError(msg);
      setMessages((prev) => [...prev, { role: "assistant", text: msg }]);
    } finally {
      setLoading(false);
    }
  }

  function fillExample(ex: string) {
    setInput(ex);
  }

  return (
    <div className="flex flex-col">
      {/* Daftar pesan */}
      <div
        ref={listRef}
        className="flex min-h-[280px] max-h-[52vh] flex-col gap-3 overflow-y-auto rounded border border-garis bg-kertas p-3 sm:p-4"
        aria-live="polite"
        aria-label="Percakapan"
      >
        {messages.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-tinta-redup">Belum ada percakapan.</p>
            <p className="mt-1 text-xs text-tinta-redup">Coba contoh di bawah:</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => fillExample(ex)}
                  className="rounded-full border border-garis bg-struk px-3 py-1.5 text-sm text-tinta hover:bg-white"
                >
                  &quot;{ex}&quot;
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-tinta-redup">
              Kalori yang dicatat diberi label <span className="font-medium">perkiraan</span>.
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-br-lg bg-biru-nota px-3.5 py-2.5 text-sm text-white"
                    : "max-w-[80%] rounded-2xl rounded-bl-lg border border-garis bg-struk px-3.5 py-2.5 text-sm text-tinta"
                }
              >
                {m.text}
                {m.role === "assistant" && m.text.toLowerCase().includes("kkal") && (
                  <span className="ml-2 rounded-full bg-kertas px-1.5 py-0.5 text-xs text-tinta-redup">
                    perkiraan
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-lg border border-garis bg-struk px-3.5 py-2.5 text-sm text-tinta-redup">
              Mencatat…
            </div>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Tulis catatan
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Tulis mis. "kopi 18rb" atau "nasi uduk 2 telur"'
          maxLength={500}
          className="min-h-11 flex-1 rounded-lg border border-garis bg-struk px-3 text-sm text-tinta placeholder:text-tinta-redup focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biru-nota"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="min-h-11 rounded-lg bg-biru-nota px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
        >
          Kirim
        </button>
      </form>
      <p className="mt-1 text-xs text-tinta-redup">{input.length}/500</p>
    </div>
  );
}
