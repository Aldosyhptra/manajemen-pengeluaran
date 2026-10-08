"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Msg = { role: "user" | "assistant"; text: string };
type InitialMsg = { id: string; role: "user" | "bot"; text: string; at: string };

const examples = ["kopi 18rb", "sarapan nasi uduk 2 telur"];

export function ChatUI({ initialMessages = [] }: { initialMessages?: InitialMsg[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(() =>
    initialMessages.map((m) => ({ role: m.role === "bot" ? "assistant" : "user", text: m.text })),
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showHapusConfirm, setShowHapusConfirm] = useState(false);
  const [hapusPending, setHapusPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages.map((m) => ({ role: m.role === "bot" ? "assistant" : "user", text: m.text }) as Msg));
    }
  }, [initialMessages]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading, loadingSlow]);

  useEffect(() => {
    if (!loading) {
      setLoadingSlow(false);
      return;
    }
    const t = setTimeout(() => setLoadingSlow(true), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    if (text.length > 500) {
      setError("Maksimal 500 karakter.");
      return;
    }
    setError(null);
    setPendingText(null);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { reply?: string; error?: { code?: string; message: string } };
      if (!res.ok) {
        const msg = data.error?.message ?? "Tidak bisa mencatat. Coba lagi.";
        const code = data.error?.code;
        if (code === "UPSTREAM_TIMEOUT" || code === "UPSTREAM_ERROR") {
          setPendingText(text);
          setInput(text);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
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

  async function handleRetry() {
    if (!pendingText || loading) return;
    const text = pendingText;
    setPendingText(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { reply?: string; error?: { code?: string; message: string } };
      if (!res.ok) {
        const msg = data.error?.message ?? "Tidak bisa mencatat. Coba lagi.";
        const code = data.error?.code;
        if (code === "UPSTREAM_TIMEOUT" || code === "UPSTREAM_ERROR") {
          setPendingText(text);
          setInput(text);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
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

  async function handleHapus() {
    setHapusPending(true);
    try {
      const res = await fetch("/api/chat/hapus", { method: "POST" });
      const data = (await res.json().catch(() => null)) as { error?: { message: string } } | null;
      if (!res.ok) {
        setError(data?.error?.message ?? "Gagal menghapus percakapan.");
        return;
      }
      setMessages([]);
      setError(null);
      setShowHapusConfirm(false);
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi, lalu coba lagi.");
    } finally {
      setHapusPending(false);
    }
  }

  function fillExample(ex: string) {
    setInput(ex);
  }

  return (
    <div className="flex flex-col">
      {messages.length > 0 && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowHapusConfirm(true)}
            disabled={hapusPending}
            className="text-sm font-medium text-tinta-redup hover:text-tinta hover:underline disabled:opacity-50"
          >
            Hapus percakapan
          </button>
        </div>
      )}
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
              {loadingSlow ? "Sabar, AI-nya baru bangun\u2026" : "Mencatat\u2026"}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">
          {error}
        </div>
      )}
      {pendingText && error && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={loading}
          className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-biru-nota px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Mengirim…" : "Kirim ulang"}
        </button>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Tulis catatan
        </label>
        <input
          ref={inputRef}
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

      <ConfirmDialog
        open={showHapusConfirm}
        title="Hapus percakapan?"
        changes={[{ label: "Riwayat", sebelum: "ada", sesudah: "kosong" }]}
        akibat="Riwayat hilang di semua perangkat. Batas pemakaian tidak direset."
        confirmLabel="Ya, hapus percakapan"
        pending={hapusPending}
        onConfirm={handleHapus}
        onCancel={() => setShowHapusConfirm(false)}
      />
    </div>
  );
}
