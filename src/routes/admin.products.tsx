import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductsFn, createProductAction, updateProductAction, deleteProductAction } from "@/lib/api/products";
import { uploadMediaFn, getMediaListFn } from "@/lib/api/media";
import { compressImage } from "@/lib/image-compress";
import { formatIDR, newId, type Product } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products")({
  component: ProductsAdmin,
});

const empty = (): Product => ({
  id: newId(),
  title: "",
  description: "",
  price: 0,
  discountPrice: undefined,
  primaryUrl: "",
  primaryLabel: "Beli Sekarang",
  secondaryUrl: "",
  secondaryLabel: "",
  mainImage: "",
  gallery: [],
  active: true,
});

function ProductsAdmin() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProductsFn(),
  });

  const createMut = useMutation({
    mutationFn: (p: Product) => createProductAction({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
  const updateMut = useMutation({
    mutationFn: (p: Partial<Product> & { id: string }) => updateProductAction({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProductAction({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  const [editing, setEditing] = useState<Product | null>(null);
  const [preview, setPreview] = useState<Product | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => { setEditing(empty()); setIsNew(true); };
  const openEdit = (p: Product) => { setEditing({ ...p }); setIsNew(false); };

  const save = async () => {
    if (!editing) return;
    if (isNew) await createMut.mutateAsync(editing);
    else await updateMut.mutateAsync(editing);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Memuat..." : `${products.length} produk terdaftar`}
        </p>
        <button
          onClick={openNew}
          className="accent-gradient accent-glow inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-white hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Tambah Produk
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.id} className="glass rounded-2xl overflow-hidden flex flex-col">
            <div className="relative aspect-video overflow-hidden bg-black/30">
              {p.mainImage ? (
                <img src={p.mainImage} alt={p.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <span
                className={cn(
                  "absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full border",
                  p.active
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                    : "bg-rose-500/15 text-rose-300 border-rose-400/30",
                )}
              >
                {p.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <p className="text-sm font-semibold line-clamp-1">{p.title || "Tanpa judul"}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>
              <div className="mt-2 text-sm accent-text font-semibold">
                {p.discountPrice ? formatIDR(p.discountPrice) : formatIDR(p.price)}
              </div>
              <div className="mt-3 flex gap-1.5">
                <button
                  onClick={() => setPreview(p)}
                  className="flex-1 h-9 rounded-lg glass text-xs inline-flex items-center justify-center gap-1 hover:bg-white/10"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 h-9 rounded-lg glass text-xs inline-flex items-center justify-center gap-1 hover:bg-white/10"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus "${p.title}"?`)) deleteMut.mutate(p.id);
                  }}
                  className="h-9 w-9 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-400/30 grid place-items-center hover:bg-rose-500/25"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ProductFormModal
          value={editing}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={save}
          isNew={isNew}
          saving={createMut.isPending || updateMut.isPending}
        />
      )}
      {preview && <ProductPreviewModal product={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

/* ---------------- Form Modal ---------------- */

function ProductFormModal({
  value,
  onChange,
  onCancel,
  onSave,
  isNew,
  saving,
}: {
  value: Product;
  onChange: (p: Product) => void;
  onCancel: () => void;
  onSave: () => void;
  isNew: boolean;
  saving: boolean;
}) {
  const patch = (p: Partial<Product>) => onChange({ ...value, ...p });

  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryModalTarget, setGalleryModalTarget] = useState<"main" | "gallery" | null>(null);

  const uploadFilesToCDN = async (files: FileList | null): Promise<string[]> => {
    if (!files) return [];
    const urls: string[] = [];
    
    for (const f of Array.from(files)) {
      try {
        const { base64, size } = await compressImage(f, 0.5);

        const res = await uploadMediaFn({
          data: {
            base64File: base64,
            fileName: f.name.replace(/\.[^/.]+$/, "") + ".jpg", // Force JPEG extension
            fileSize: size,
          }
        });

        if (res.ok && res.data?.url) {
          urls.push(res.data.url);
        } else {
          alert(res.error || `Gagal mengunggah file ${f.name}`);
        }
      } catch (err: any) {
        alert(err.message || `Gagal mengunggah file ${f.name}`);
      }
    }
    return urls;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md p-3 md:p-6 overflow-y-auto animate-in fade-in"
      onClick={onCancel}
    >
      <div
        className="glass-strong shimmer-border relative mx-auto max-w-5xl rounded-2xl p-5 md:p-6 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">
              {isNew ? "Tambah Produk" : "Edit Produk"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Isi detail produk lalu simpan untuk mempublikasikan.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="h-9 w-9 rounded-full grid place-items-center bg-white/10 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid lg:grid-cols-2 gap-5">
          {/* Left: Inputs */}
          <div className="space-y-3">
            <Field label="Nama Produk">
              <input className="input" value={value.title} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <Field label="Deskripsi">
              <textarea rows={4} className="input resize-none" value={value.description} onChange={(e) => patch({ description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Harga (Rp)">
                <input type="number" className="input" value={value.price} onChange={(e) => patch({ price: Number(e.target.value) })} />
              </Field>
              <Field label="Harga Diskon (opsional)">
                <input
                  type="number"
                  className="input"
                  value={value.discountPrice ?? ""}
                  onChange={(e) => patch({ discountPrice: e.target.value ? Number(e.target.value) : undefined })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Link Utama">
                <input className="input" value={value.primaryUrl} onChange={(e) => patch({ primaryUrl: e.target.value })} />
              </Field>
              <Field label="Label Utama">
                <input className="input" value={value.primaryLabel} onChange={(e) => patch({ primaryLabel: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Link Sekunder">
                <input className="input" value={value.secondaryUrl || ""} onChange={(e) => patch({ secondaryUrl: e.target.value })} />
              </Field>
              <Field label="Label Sekunder">
                <input className="input" value={value.secondaryLabel || ""} onChange={(e) => patch({ secondaryLabel: e.target.value })} />
              </Field>
            </div>
            <label className="flex items-center justify-between glass rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium">Status Aktif</p>
                <p className="text-xs text-muted-foreground">Tampilkan di halaman publik</p>
              </div>
              <input
                type="checkbox"
                checked={value.active}
                onChange={(e) => patch({ active: e.target.checked })}
                className="h-5 w-9 appearance-none rounded-full bg-white/10 relative cursor-pointer transition
                  checked:bg-[var(--accent-1)]
                  before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition
                  checked:before:translate-x-4"
              />
            </label>
          </div>

          {/* Right: Media */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">Gambar Utama</span>
              <button
                type="button"
                onClick={() => setGalleryModalTarget("main")}
                className="text-xs text-blue-300 hover:text-blue-200 inline-flex items-center gap-1 hover:underline"
              >
                <FolderOpen className="h-3 w-3" /> Pilih dari Galeri
              </button>
            </div>
            <Dropzone
              onFiles={async (files) => {
                setUploadingMain(true);
                const arr = await uploadFilesToCDN(files);
                if (arr[0]) patch({ mainImage: arr[0] });
                setUploadingMain(false);
              }}
            >
              {uploadingMain ? (
                <div className="h-full w-full grid place-items-center bg-white/5">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                </div>
              ) : value.mainImage ? (
                <img src={value.mainImage} alt="" className="h-full w-full object-cover rounded-xl" />
              ) : (
                <UploadEmpty label="Drop / klik untuk upload gambar utama" />
              )}
            </Dropzone>
            {value.mainImage && (
              <button onClick={() => patch({ mainImage: "" })} className="text-xs text-rose-300 hover:underline block">
                Hapus gambar utama
              </button>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground font-semibold">Galeri Tambahan</span>
              <button
                type="button"
                onClick={() => setGalleryModalTarget("gallery")}
                className="text-xs text-blue-300 hover:text-blue-200 inline-flex items-center gap-1 hover:underline"
              >
                <FolderOpen className="h-3 w-3" /> Pilih dari Galeri
              </button>
            </div>
            <Dropzone
              small
              onFiles={async (files) => {
                setUploadingGallery(true);
                const arr = await uploadFilesToCDN(files);
                patch({ gallery: [...value.gallery, ...arr] });
                setUploadingGallery(false);
              }}
            >
              {uploadingGallery ? (
                <div className="h-full w-full grid place-items-center bg-white/5">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                </div>
              ) : (
                <UploadEmpty label="Tambahkan beberapa gambar sekaligus" />
              )}
            </Dropzone>
            {value.gallery.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {value.gallery.map((g, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                    <img src={g} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => patch({ gallery: value.gallery.filter((_, j) => j !== i) })}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 grid place-items-center hover:bg-rose-500/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Live Preview</p>
          <div className="max-w-xs mx-auto">
            <ProductCardPreview product={value} />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="glass h-10 px-4 rounded-xl text-sm hover:bg-white/10">
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={saving || !value.title}
            className="accent-gradient accent-glow h-10 px-5 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan
          </button>
        </div>

        {galleryModalTarget && (
          <MediaSelectorModal
            onClose={() => setGalleryModalTarget(null)}
            onSelect={(url) => {
              if (galleryModalTarget === "main") {
                patch({ mainImage: url });
              } else {
                patch({ gallery: [...value.gallery, url] });
              }
              setGalleryModalTarget(null);
            }}
          />
        )}
      </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Dropzone({ children, onFiles, small }: { children: React.ReactNode; onFiles: (files: FileList | null) => void; small?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => { e.preventDefault(); setHover(false); onFiles(e.dataTransfer.files); }}
      className={cn(
        "relative block rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition",
        hover ? "border-[var(--accent-1)] bg-white/5" : "border-white/15 bg-white/[0.02] hover:bg-white/5",
        small ? "h-24" : "aspect-video",
      )}
    >
      <input type="file" multiple={small} accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
      {children}
    </label>
  );
}

function UploadEmpty({ label }: { label: string }) {
  return (
    <div className="h-full w-full grid place-items-center text-muted-foreground text-xs text-center p-4">
      <div>
        <Upload className="h-5 w-5 mx-auto mb-1" />
        {label}
      </div>
    </div>
  );
}

function ProductCardPreview({ product }: { product: Product }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="aspect-square overflow-hidden bg-black/30">
        {product.mainImage ? (
          <img src={product.mainImage} className="h-full w-full object-cover" alt="" />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-1">{product.title || "Nama produk"}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{product.description || "Deskripsi produk"}</p>
        <div className="mt-2">
          {product.price === 0 && !product.discountPrice ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">Gratis</span>
          ) : product.discountPrice ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold accent-text">{formatIDR(product.discountPrice)}</span>
              <span className="text-[10px] line-through text-muted-foreground">{formatIDR(product.price)}</span>
            </div>
          ) : (
            <span className="text-sm font-semibold accent-text">{formatIDR(product.price)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductPreviewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in" onClick={onClose}>
      <div className="glass-strong shimmer-border rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-semibold">Preview Publik</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full grid place-items-center bg-white/10 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ProductCardPreview product={product} />
        <div className="mt-4 flex gap-2">
          {product.primaryUrl && (
            <a
              href={product.primaryUrl}
              target="_blank"
              rel="noreferrer"
              className="accent-gradient flex-1 h-10 rounded-xl grid place-items-center text-sm text-white font-medium"
            >
              <span className="inline-flex items-center gap-1.5">
                {product.primaryLabel} <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
