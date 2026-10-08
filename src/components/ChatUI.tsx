"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Msg = { role: "user" | "assistant"; text: string; imageUrl?: string };
type InitialMsg = { id: string; role: "user" | "bot"; text: string; at: string };

const examples = ["kopi 18rb", "sarapan nasi uduk 2 telur"];
const MAX_FOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export function ChatUI({ initialMessages = [] }: { initialMessages?: InitialMsg[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(() =>
    initialMessages.map((m) => ({ role: m.role === "bot" ? "assistant" : "user", text: m.text })),
  );
  const [input, setInput] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [pendingFoto, setPendingFoto] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);
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
  }, [messages, loading, loadingSlow, fotoPreview]);

  useEffect(() => {
    if (!loading) {
      setLoadingSlow(false);
      return;
    }
    const t = setTimeout(() => setLoadingSlow(true), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  // revoke preview yang tidak dipakai bubble
  useEffect(() => {
    return () => {
      if (fotoPreview && !messages.some((m) => m.imageUrl === fotoPreview)) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview, messages]);

  function onPickFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    // reset input value agar bisa pilih file yang sama lagi setelah hapus
    e.target.value = "";
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Foto harus JPG, PNG, atau WebP.");
      return;
    }
    if (f.size > MAX_FOTO_BYTES) {
      setError("Foto maksimal 5MB.");
      return;
    }
    setError(null);
    // jangan revoke jika masih dipakai bubble
    if (fotoPreview && !messages.some((m) => m.imageUrl === fotoPreview)) {
      URL.revokeObjectURL(fotoPreview);
    }
    setFotoFile(f);
    setFotoPreview(URL.createObjectURL(f));
  }

  function clearFoto() {
    if (fotoPreview && !messages.some((m) => m.imageUrl === fotoPreview)) {
      URL.revokeObjectURL(fotoPreview);
    }
    // biarkan URL tetap hidup jika dipakai bubble — jangan hapus referensi bubble
    // tapi picker state di-clear
    setFotoPreview(null);
    setFotoFile(null);
  }

  async function sendPayload(text: string, foto: File | null, opts: { addUserBubble: boolean }) {
    const caption = text.trim();
    if (!caption && !foto) return;

    if (opts.addUserBubble) {
      const preview = foto ? fotoPreview ?? undefined : undefined;
      const bubbleText = caption || (foto ? "(foto)" : "");
      setMessages((prev) => [...prev, { role: "user", text: bubbleText, imageUrl: preview }]);
    }

    setLoading(true);
    try {
      let res: Response;
      if (foto) {
        const fd = new FormData();
        fd.append("text", caption);
        fd.append("foto", foto, foto.name);
        res = await fetch("/api/chat", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: caption }),
        });
      }
      const data = (await res.json()) as { reply?: string; error?: { code?: string; message: string } };
      if (!res.ok) {
        const msg = data.error?.message ?? "Tidak bisa mencatat. Coba lagi.";
        const code = data.error?.code;
        if (code === "UPSTREAM_TIMEOUT" || code === "UPSTREAM_ERROR") {
          setPendingText(caption);
          setPendingFoto(foto);
          setInput(caption);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    const foto = fotoFile;
    if (!text && !foto) return;
    if (loading) return;
    if (text.length > 500) {
      setError("Maksimal 500 karakter.");
      return;
    }
    setError(null);
    setPendingText(null);
    setPendingFoto(null);
    const previewToKeep = fotoPreview;
    // clear input + foto optimistically but keep preview for bubble
    setInput("");
    // jangan revoke langsung — bubble butuh URL; revoke saat clearFoto atau unmount berikutnya
    // simpan lalu clear state file tapi biarkan preview URL hidup untuk bubble
    setFotoFile(null);
    // fotoPreview tetap sampai next pick/clear — tidak di-null agar bubble tetap tampil
    // namun input file sudah kosong

    await sendPayload(text, foto, { addUserBubble: true });

    // bubble sudah punya URL fotoPreview yang sama; picker disembunyikan (fotoFile null) tapi URL tetap untuk bubble
    void previewToKeep;
  }

  async function handleRetry() {
    if (loading) return;
    if (pendingText === null && pendingFoto === null) return;
    const text = pendingText ?? "";
    const foto = pendingFoto;
    setPendingText(null);
    setPendingFoto(null);
    setError(null);
    await sendPayload(text, foto, { addUserBubble: false });
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

  const hasFotoPicker = !!fotoFile && !!fotoPreview;

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
              Kalori yang dicatat diberi label <span className="font-medium">perkiraan</span>. Foto makanan juga bisa dikirim.
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[80%] rounded-2xl rounded-br-lg bg-biru-nota px-3.5 py-2.5 text-sm text-white"
                    : "max-w-[80%] rounded-2xl rounded-bl-lg border border-garis bg-struk px-3.5 py-2.5 text-sm text-tinta"
                }
              >
                {m.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageUrl} alt="Foto yang dikirim" className="mb-2 max-h-48 w-auto rounded-lg object-cover" />
                )}
                {m.text}
                {m.role === "assistant" && m.text.toLowerCase().includes("kkal") && (
                  <span className="ml-2 rounded-full bg-kertas px-1.5 py-0.5 text-xs text-tinta-redup">perkiraan</span>
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
      {(pendingText !== null || pendingFoto !== null) && error && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={loading}
          className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-biru-nota px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Mengirim\u2026" : "Kirim ulang"}
        </button>
      )}

      {hasFotoPicker && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-garis bg-struk p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoPreview!} alt="Preview foto" className="h-16 w-16 rounded-md object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-tinta">{fotoFile?.name}</p>
            <p className="text-xs text-tinta-redup">{fotoFile ? (fotoFile.size / 1024).toFixed(0) + " KB" : ""} · maks 5MB</p>
            <p className="mt-1 text-xs text-tinta-redup">Caption: tulis harga/keterangan atau &quot;kalori saja&quot; / &quot;pengeluaran saja&quot;</p>
          </div>
          <button
            type="button"
            onClick={clearFoto}
            aria-label="Hapus foto"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-garis bg-kertas text-tinta hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
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
          placeholder={hasFotoPicker ? "Caption foto (opsional) — mis. kopi 18rb" : "Tulis mis. \"kopi 18rb\" atau \"nasi uduk 2 telur\""}
          maxLength={500}
          className="min-h-11 flex-1 rounded-lg border border-garis bg-struk px-3 text-sm text-tinta placeholder:text-tinta-redup focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biru-nota"
          autoComplete="off"
        />
        <input
          ref={fotoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPickFoto}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        <button
          type="button"
          onClick={() => fotoInputRef.current?.click()}
          disabled={loading}
          aria-label="Pilih foto"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-garis bg-struk text-tinta hover:bg-kertas disabled:opacity-50"
        >
          <Camera className="h-5 w-5" />
        </button>
        <button
          type="submit"
          disabled={loading || (!input.trim() && !fotoFile)}
          className="min-h-11 rounded-lg bg-biru-nota px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
        >
          Kirim
        </button>
      </form>
      <p className="mt-1 text-xs text-tinta-redup">
        {input.length}/500{hasFotoPicker ? " · foto siap dikirim" : ""} · foto JPG/PNG/WebP maks 5MB
      </p>

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
