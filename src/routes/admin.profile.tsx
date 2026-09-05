import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Key, User, Mail, ShieldAlert, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUserFn, updateAccountAction } from "@/lib/api/auth";
import { Input } from "./admin.services";

export const Route = createFileRoute("/admin/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUserFn(),
  });

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  // Set initial form state when user data is fetched
  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const updateAccountMut = useMutation({
    mutationFn: (data: { username: string; email: string; password?: string }) =>
      updateAccountAction({ data }),
    onSuccess: (res) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["currentUser"] });
        setSuccess(true);
        setPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setFormError(res.error || "Terjadi kesalahan saat memperbarui akun.");
      }
    },
    onError: (err: any) => {
      try {
        const parsed = JSON.parse(err.message);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          setFormError(parsed[0].message);
          return;
        }
      } catch {}
      setFormError("Gagal menghubungi server. Coba beberapa saat lagi.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccess(false);

    if (username.trim().length < 3) {
      setFormError("Username minimal 3 karakter.");
      return;
    }

    if (password) {
      if (password.length < 6) {
        setFormError("Password baru minimal 6 karakter.");
        return;
      }
      if (password !== confirmPassword) {
        setFormError("Konfirmasi password baru tidak cocok.");
        return;
      }
    }

    updateAccountMut.mutate({
      username: username.trim(),
      email: email.trim(),
      password: password || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-2" />
        <p className="text-xs text-muted-foreground">Memuat data akun...</p>
      </div>
    );
  }

  const isSaving = updateAccountMut.isPending;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-display font-bold tracking-tight">Pengaturan Profil & Akun</h2>
        <p className="text-sm text-muted-foreground">
          Kelola kredensial login, alamat email, dan password admin Anda.
        </p>
      </div>

      <div className="glass rounded-2xl p-6 border border-white/10 relative overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-36 h-36 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {formError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm animate-in fade-in slide-in-from-top-1">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm animate-in fade-in slide-in-from-top-1">
              <Check className="h-5 w-5 shrink-0" />
              <span>Profil akun berhasil diperbarui!</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <User className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-medium text-white">Informasi Dasar</h3>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Username Login"
                value={username}
                onChange={setUsername}
                placeholder="admin"
                name="username"
                autoComplete="username"
              />
              <Input
                label="Email Kontak / Akun"
                value={email}
                type="email"
                onChange={setEmail}
                placeholder="admin@example.com"
                name="email"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Key className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-medium text-white">Ubah Password</h3>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              Biarkan kosong jika Anda tidak ingin mengubah password saat ini.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Password Baru"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                name="new-password"
                autoComplete="new-password"
              />
              <Input
                label="Konfirmasi Password Baru"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
                name="confirm-password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="accent-gradient accent-glow h-11 px-6 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.01]"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </button>
            {success && <span className="text-sm text-emerald-300 animate-in fade-in">Tersimpan ✓</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
