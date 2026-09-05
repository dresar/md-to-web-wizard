import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Eye, EyeOff, Loader2, Terminal, Lock, User, Sparkles } from "lucide-react";
import { loginAction } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login-admin")({
  component: LoginPage,
});

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [devFilled, setDevFilled] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  /** 🔧 Login Dev — mengisi field form saja, user tetap harus klik Masuk */
  const fillDevCredentials = () => {
    setUsername("admin");
    setPassword("admin123");
    setDevFilled(true);
    setError(null);
    setTimeout(() => setDevFilled(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username dan password wajib diisi.");
      triggerShake();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await loginAction({ data: { username, password } });
      if (result.ok) {
        window.location.href = "/admin";
      } else {
        setError(result.error ?? "Login gagal.");
        triggerShake();
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent-1), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent-2), transparent 70%)" }}
      />

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block relative">
            <div className="accent-gradient absolute -inset-1.5 rounded-2xl blur opacity-75" />
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="relative h-16 w-16 rounded-2xl border border-white/20 object-cover shadow-2xl" 
            />
          </div>
          <h1 className="font-display text-2xl font-bold mt-4">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Masuk untuk mengelola konten bio link</p>
        </div>

        {/* Card */}
        <div
          className={cn(
            "glass-strong shimmer-border rounded-3xl p-8 transition-all duration-300 shadow-2xl relative border border-white/10",
            shake && "animate-[shake_0.5s_ease-in-out]"
          )}
          style={
            shake
              ? { animation: "shake 0.5s ease-in-out" }
              : undefined
          }
        >
          {!import.meta.env.PROD && (
            <>
              {/* 🔧 Login Dev Button */}
              <button
                id="btn-login-dev"
                type="button"
                onClick={fillDevCredentials}
                className={cn(
                  "w-full mb-5 h-11 rounded-xl border-2 border-dashed text-sm font-medium",
                  "inline-flex items-center justify-center gap-2 transition-all duration-200",
                  devFilled
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-[var(--accent-1)]/50 hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Terminal className="h-4 w-4" />
                {devFilled ? "✓ Credential dev sudah diisi — klik Masuk!" : "🔧 Login Dev (isi otomatis)"}
              </button>

              {devFilled && (
                <div className="mb-4 text-[11px] text-center text-muted-foreground bg-white/5 rounded-lg py-2 px-3 border border-white/10 animate-in fade-in slide-in-from-top-1">
                  Username: <strong className="text-foreground">admin</strong> · Password:{" "}
                  <strong className="text-foreground">admin123</strong> — Klik{" "}
                  <strong className="accent-text">Masuk</strong> di bawah
                </div>
              )}

              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] text-muted-foreground uppercase tracking-widest">atau masuk manual</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5" htmlFor="login-username">
                <User className="h-3.5 w-3.5" />
                Username
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                placeholder="Masukkan username"
                className="input w-full"
              />
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5" htmlFor="login-password">
                <Lock className="h-3.5 w-3.5" />
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Masukkan password"
                  className="input pr-10 w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-400/30 px-4 py-3 text-sm text-rose-300 animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl accent-gradient accent-glow text-white font-semibold text-sm inline-flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-60 mt-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Memverifikasi..." : "Masuk ke Admin Panel"}
            </button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Akses terbatas · Admin Bio Link
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
