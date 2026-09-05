import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  Loader2, 
  FileImage,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { getMediaListFn, uploadMediaFn, deleteMediaFn } from "@/lib/api/media";
import { getSettingsFn } from "@/lib/api/settings";
import { compressImage } from "@/lib/image-compress";

export const Route = createFileRoute("/admin/media")({
  component: MediaPage,
});

function MediaPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Queries
  const { data: mediaList = [], isLoading: mediaLoading } = useQuery({
    queryKey: ["media-list"],
    queryFn: () => getMediaListFn(),
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => getSettingsFn(),
  });

  // Check if ImageKit is configured
  const isImageKitConfigured = 
    (settings?.imagekitPublicKey && settings?.imagekitPrivateKey && settings?.imagekitUrlEndpoint) ||
    // Or if environment variables are set (we'll check settings but warn if empty)
    true; 

  // Mutations
  const uploadMut = useMutation({
    mutationFn: (variables: { base64File: string; fileName: string; fileSize: number }) => 
      uploadMediaFn({ data: variables }),
    onSuccess: (res) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["media-list"] });
        setUploadError(null);
      } else {
        setUploadError(res.error || "Gagal mengunggah gambar.");
      }
    },
    onError: (err: any) => {
      setUploadError(err.message || "Gagal menghubungi server.");
    }
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteMediaFn({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["media-list"] });
        setDeleteConfirmId(null);
      } else {
        alert(res.error || "Gagal menghapus gambar.");
      }
    },
    onError: (err: any) => {
      alert(err.message || "Gagal menghubungi server.");
    }
  });

  // Handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setUploadError("Hanya file gambar yang diperbolehkan.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Compress image client-side, preserving transparency
      const { base64, size, mimeType } = await compressImage(file, 0.5);
      const ext = mimeType === "image/png" ? ".png" : ".jpg";

      await uploadMut.mutateAsync({
        base64File: base64,
        fileName: file.name.replace(/\.[^/.]+$/, "") + ext,
        fileSize: size,
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError(err.message || "Gagal memproses/mengunggah gambar.");
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Informational Warning if not fully configured */}
      {!settings?.imagekitPublicKey && (
        <div className="glass border-yellow-500/20 bg-yellow-500/5 text-yellow-200 rounded-2xl p-4 flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">ImageKit Belum Terkonfigurasi di Halaman Pengaturan</h4>
            <p className="text-xs text-yellow-200/80 leading-relaxed">
              Sistem saat ini menggunakan kredensial dari file `.env` (jika ada). Anda direkomendasikan untuk memasukkan kredensial ImageKit Anda langsung di menu <Link to="/admin/settings" className="underline hover:text-white font-medium">Pengaturan Admin</Link> agar pengunggahan gambar berjalan lancar.
            </p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <section className="glass rounded-2xl p-5">
        <h3 className="font-display font-semibold mb-3">Unggah Media Baru</h3>
        <p className="text-xs text-muted-foreground mb-4">Unggah aset gambar Anda langsung ke CDN ImageKit untuk digunakan pada profil, produk, atau layanan.</p>
        
        <div 
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px] ${
            uploading 
              ? "border-blue-500/30 bg-blue-500/5 cursor-not-allowed" 
              : "border-white/10 hover:border-white/20 hover:bg-white/5"
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
            disabled={uploading}
          />
          
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-blue-400 animate-spin mb-3" />
              <p className="text-sm font-medium">Mengunggah ke ImageKit CDN...</p>
              <p className="text-xs text-muted-foreground mt-1">Harap tunggu beberapa saat.</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Klik untuk memilih gambar atau seret file ke sini</p>
              <p className="text-xs text-muted-foreground mt-1">Mendukung format PNG, JPG, JPEG, WEBP, GIF, SVG</p>
            </>
          )}
        </div>

        {uploadError && (
          <div className="mt-3 text-xs text-rose-300 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
            {uploadError}
          </div>
        )}
      </section>

      {/* Media Gallery Grid */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Galeri CDN</h3>
          <span className="text-xs text-muted-foreground">{mediaList.length} Gambar diunggah</span>
        </div>

        {mediaLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-2" />
            <p className="text-xs text-muted-foreground">Memuat daftar gambar...</p>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="text-center py-16 border border-white/5 rounded-xl bg-white/[0.02]">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-muted-foreground">Galeri Media Kosong</p>
            <p className="text-xs text-muted-foreground mt-1">Unggah gambar pertama Anda untuk memulai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {mediaList.map((item: any) => (
              <div 
                key={item.id} 
                className="group relative glass rounded-xl overflow-hidden border border-white/10 flex flex-col transition hover:scale-[1.02] hover:border-white/20"
              >
                {/* Image Display */}
                <div className="aspect-square bg-black/40 relative overflow-hidden flex items-center justify-center">
                  <img 
                    src={item.url} 
                    alt={item.name} 
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Copy & View Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-between p-2">
                    <div className="flex justify-end gap-1.5">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white grid place-items-center transition"
                        title="Buka gambar asli"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      
                      <button 
                        onClick={() => handleCopyUrl(item.url, item.id)}
                        className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white grid place-items-center transition"
                        title="Salin URL gambar"
                      >
                        {copiedId === item.id ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Delete Confirm Overlay */}
                    {deleteConfirmId === item.id ? (
                      <div className="bg-black/85 rounded-lg p-1.5 text-center space-y-1.5 animate-in fade-in zoom-in-95">
                        <p className="text-[10px] font-medium text-rose-200">Hapus permanen?</p>
                        <div className="flex justify-center gap-1.5">
                          <button 
                            disabled={deleteMut.isPending}
                            onClick={() => deleteMut.mutate(item.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] px-2 py-1 rounded font-medium disabled:opacity-50"
                          >
                            {deleteMut.isPending ? "..." : "Ya, Hapus"}
                          </button>
                          <button 
                            onClick={() => setDeleteConfirmId(null)}
                            className="bg-white/10 hover:bg-white/20 text-white text-[10px] px-2 py-1 rounded font-medium"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button 
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="h-8 w-8 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 grid place-items-center transition"
                          title="Hapus gambar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Short Copied Notification */}
                  {copiedId === item.id && (
                    <div className="absolute inset-0 bg-emerald-950/80 flex items-center justify-center p-2 text-center text-xs text-emerald-300 animate-in fade-in">
                      <div className="space-y-1">
                        <Check className="h-5 w-5 text-emerald-400 mx-auto" />
                        <span className="font-medium">URL Disalin!</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata info */}
                <div className="p-2 space-y-0.5 text-left border-t border-white/5 bg-white/[0.01]">
                  <p className="text-xs font-medium truncate text-foreground/90" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{formatBytes(item.size)}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
