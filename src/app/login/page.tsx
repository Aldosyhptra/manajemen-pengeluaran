"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function sanitizeNext(v: string | null): string {
  if (!v) return "/";
  if (!v.startsWith("/") || v.startsWith("//")) return "/";
  return v;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = (await res.json().catch(() => null)) as { error?: { message?: string }; wajibGantiPassword?: boolean } | null;
      if (!res.ok) {
        const msg = data?.error?.message ?? "Username atau password salah.";
        setError(msg);
        return;
      }
      if (data?.wajibGantiPassword) {
        router.push("/ganti-password");
        router.refresh();
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi, lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded border border-garis bg-struk p-4 sm:p-5">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-tinta">
          Username
        </Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          autoComplete="username"
          required
          aria-invalid={!!error}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-tinta">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            aria-invalid={!!error}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-2 flex items-center justify-center rounded-r-md text-tinta-redup hover:text-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biru-nota focus-visible:ring-offset-2"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded border border-stempel/30 bg-stempel/10 px-3 py-2 text-sm text-stempel">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Memeriksa…": "Masuk"}
      </Button>
      <p className="text-center text-sm text-tinta-redup">
        Lupa password? Hubungi admin untuk mereset password.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex h-full flex-1 items-center justify-center px-4 py-8">
      <main className="w-full max-w-sm -mt-8">
        <h1 className="font-heading text-2xl font-bold text-tinta">Masuk</h1>
        <p className="mt-2 text-sm text-tinta-redup">Masuk dengan username dan password.</p>
        <Suspense
          fallback={<div className="mt-6 rounded border border-garis bg-struk p-4 text-sm text-tinta-redup">Memuat…</div>}
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
