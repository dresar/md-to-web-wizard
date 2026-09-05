import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2, FolderOpen, X, Image as ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfileFn, updateProfileAction } from "@/lib/api/profile";
import { getSettingsFn, updateSettingsAction } from "@/lib/api/settings";
import { getMediaListFn } from "@/lib/api/media";
import { useBioStore, accentPresets, type AccentName } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Input } from "./admin.services";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const setAccentUi = useBioStore((s) => s.setAccent);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => getSettingsFn() });

  const [localProfile, setLocalProfile] = useState<typeof profile>(undefined);
  const [localSettings, setLocalSettings] = useState<typeof settings>(undefined);

  const currentProfile = localProfile ?? profile ?? {
    name: "", title: "", description: "", avatarUrl: "", verified: false, whatsappNumber: "", slug: "",
  };
  const currentSettings = localSettings ?? settings ?? {
    siteTitle: "", siteDescription: "", accent: "blue" as AccentName, theme: "dark" as const,
    imagekitPublicKey: "", imagekitPrivateKey: "", imagekitUrlEndpoint: "",
  };

  const updateProfileMut = useMutation({
    mutationFn: (data: {
      name?: string;
      title?: string;
      description?: string;
      avatarUrl?: string;
      verified?: boolean;
      whatsappNumber?: string;
      slug?: string;
    }) => updateProfileAction({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
  const updateSettingsMut = useMutation({
    mutationFn: (data: {
      siteTitle?: string;
      siteDescription?: string;
      accent?: string;
      theme?: "dark" | "light";
      imagekitPublicKey?: string;
      imagekitPrivateKey?: string;
      imagekitUrlEndpoint?: string;
    }) => updateSettingsAction({ data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  const [saved, setSaved] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  const handleSave = async () => {
    await updateProfileMut.mutateAsync({
      name: currentProfile.name,
      title: currentProfile.title,
      description: currentProfile.description,
      avatarUrl: currentProfile.avatarUrl,
      verified: currentProfile.verified,
      whatsappNumber: currentProfile.whatsappNumber,
      slug: currentProfile.slug,
    });
    await updateSettingsMut.mutateAsync({
      siteTitle: currentSettings.siteTitle,
      siteDescription: currentSettings.siteDescription,
      accent: currentSettings.accent,
      theme: currentSettings.theme,
      imagekitPublicKey: currentSettings.imagekitPublicKey,
      imagekitPrivateKey: currentSettings.imagekitPrivateKey,
      imagekitUrlEndpoint: currentSettings.imagekitUrlEndpoint,
    });
    setLocalProfile(undefined);
    setLocalSettings(undefined);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const saving = updateProfileMut.isPending || updateSettingsMut.isPending;

  const patchProfile = (p: Partial<typeof currentProfile>) =>
    setLocalProfile({ ...currentProfile, ...p });
  const patchSettings = (s: Partial<typeof currentSettings>) =>
    setLocalSettings({ ...currentSettings, ...s });

  return (
    <div className="space-y-6 max-w-3xl">
      <section className="glass rounded-2xl p-5">
        <h3 className="font-display font-semibold">Profil</h3>
        <div className="mt-4 flex items-end gap-4">
          {currentProfile.avatarUrl && (
            <img src={currentProfile.avatarUrl} alt="" className="h-16 w-16 rounded-full border border-white/20 object-cover shrink-0" />
          )}
          <div className="flex-1 flex gap-2 items-end">
            <div className="flex-1">
              <Input
                label="URL Avatar"
                value={currentProfile.avatarUrl}
                onChange={(v) => patchProfile({ avatarUrl: v })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowGalleryModal(true)}
              className="glass h-10 px-3.5 rounded-xl text-xs hover:bg-white/10 shrink-0 inline-flex items-center gap-1.5 border border-white/10"
              title="Pilih dari Galeri"
            >
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Pilih dari Galeri</span>
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input label="Nama" value={currentProfile.name} onChange={(v) => patchProfile({ name: v })} />
          <Input label="Jabatan" value={currentProfile.title} onChange={(v) => patchProfile({ title: v })} />
        </div>
        <div className="mt-3">
          <Input label="Deskripsi" textarea value={currentProfile.description} onChange={(v) => patchProfile({ description: v })} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Input
            label="Nomor WhatsApp (format: 62xxxx)"
            value={currentProfile.whatsappNumber}
            onChange={(v) => patchProfile({ whatsappNumber: v.replace(/\D/g, "") })}
          />
          <Input label="Slug" value={currentProfile.slug} onChange={(v) => patchProfile({ slug: v })} />
        </div>
        <label className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={currentProfile.verified}
            onChange={(e) => patchProfile({ verified: e.target.checked })}
          />
          <span className="text-sm">Tampilkan badge terverifikasi</span>
        </label>
      </section>

      <section className="glass rounded-2xl p-5">
        <h3 className="font-display font-semibold">SEO Situs</h3>
        <div className="mt-4 grid gap-3">
          <Input label="Judul situs" value={currentSettings.siteTitle} onChange={(v) => patchSettings({ siteTitle: v })} />
          <Input label="Deskripsi situs" textarea value={currentSettings.siteDescription} onChange={(v) => patchSettings({ siteDescription: v })} />
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold">Konfigurasi ImageKit CDN</h3>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-medium">CDN Upload</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Mengaktifkan upload gambar langsung ke ImageKit CDN. Jika dikosongkan, sistem akan mencoba mengambil dari file .env.</p>
        <div className="mt-4 grid gap-3">
          <Input 
            label="ImageKit Public Key" 
            value={currentSettings.imagekitPublicKey ?? ""} 
            onChange={(v) => patchSettings({ imagekitPublicKey: v })} 
            placeholder="ik_pub_..."
          />
          <Input 
            label="ImageKit Private Key" 
            value={currentSettings.imagekitPrivateKey ?? ""} 
            onChange={(v) => patchSettings({ imagekitPrivateKey: v })} 
            placeholder="ik_pri_..."
            type="password"
          />
          <Input 
            label="ImageKit URL Endpoint" 
            value={currentSettings.imagekitUrlEndpoint ?? ""} 
            onChange={(v) => patchSettings({ imagekitUrlEndpoint: v })} 
            placeholder="https://ik.imagekit.io/username"
          />
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <h3 className="font-display font-semibold">Tema Aksen</h3>
        <p className="text-xs text-muted-foreground">Warna aksen ini juga bisa diubah cepat lewat tombol palet di halaman publik.</p>
        <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-3">
          {accentPresets.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                patchSettings({ accent: p.name });
                setAccentUi(p.name);
              }}
              className={cn(
                "aspect-square rounded-2xl border border-white/15 relative transition hover:scale-105",
                currentSettings.accent === p.name && "ring-2 ring-white/80",
              )}
              style={{
                backgroundImage: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                boxShadow: `0 10px 25px -10px ${p.from}`,
              }}
            >
              {currentSettings.accent === p.name && (
                <Check className="h-5 w-5 text-white absolute inset-0 m-auto" />
              )}
              <span className="absolute bottom-1 left-0 right-0 text-[10px] text-white/90">{p.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="accent-gradient accent-glow h-11 px-6 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan Perubahan
        </button>
        {saved && <span className="text-sm text-emerald-300 animate-in fade-in">Tersimpan ✓</span>}
      </div>

      {showGalleryModal && (
        <MediaSelectorModal
          onClose={() => setShowGalleryModal(false)}
          onSelect={(url) => {
            patchProfile({ avatarUrl: url });
            setShowGalleryModal(false);
          }}
        />
      )}
    </div>
  );
}

function MediaSelectorModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const { data: mediaList = [], isLoading } = useQuery({
    queryKey: ["media-list"],
    queryFn: () => getMediaListFn(),
  });

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md grid place-items-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="glass-strong border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="font-display font-semibold">Pilih dari Galeri CDN</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full grid place-items-center bg-white/10 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px] pr-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-2" />
              <p className="text-xs text-muted-foreground">Memuat galeri media...</p>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] border border-dashed border-white/10 rounded-xl">
              <ImageIcon className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">Galeri kosong</p>
              <p className="text-xs text-muted-foreground mt-1">Unggah gambar di menu Media Manager terlebih dahulu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {mediaList.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.url)}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-blue-400 transition hover:scale-105"
                >
                  <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-150 flex items-end p-1.5">
                    <p className="text-[9px] text-white truncate w-full font-medium">{item.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end shrink-0">
          <button onClick={onClose} className="glass h-9 px-4 rounded-lg text-xs hover:bg-white/10">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
