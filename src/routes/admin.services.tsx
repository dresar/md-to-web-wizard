import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Globe,
  Palette,
  Bot,
  MessagesSquare,
  Package,
  Sparkles,
  Coffee,
  type LucideIcon,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getServicesFn,
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
} from "@/lib/api/services";
import { newId, type Service } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/services")({
  component: ServicesAdmin,
});

const empty = (order: number): Service => ({
  id: newId(),
  title: "",
  description: "",
  icon: "Globe",
  url: "",
  gradientFrom: "#2563eb",
  gradientTo: "#60a5fa",
  order,
  active: true,
});

const ICON_OPTIONS = ["Globe", "Palette", "Bot", "MessagesSquare", "Package", "Sparkles", "Coffee"];

const ICONS: Record<string, LucideIcon> = {
  Globe,
  Palette,
  Bot,
  MessagesSquare,
  Package,
  Sparkles,
  Coffee,
};

function Icon({ name, className }: { name: string; className?: string }) {
  const isImageUrl = name.startsWith("http://") || name.startsWith("https://") || name.includes("/") || name.includes(".");
  if (isImageUrl) {
    return <img src={name} alt="" className={cn(className, "object-contain rounded-sm max-h-full max-w-full")} />;
  }
  const C = ICONS[name] || Globe;
  return <C className={className} />;
}

function ServicesAdmin() {
  const qc = useQueryClient();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => getServicesFn(),
  });

  const createMut = useMutation({
    mutationFn: (s: Service) => createServiceAction({ data: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
  const updateMut = useMutation({
    mutationFn: (s: Partial<Service> & { id: string }) => updateServiceAction({ data: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteServiceAction({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });

  const [editing, setEditing] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => { setEditing(empty(services.length + 1)); setIsNew(true); };

  const save = async () => {
    if (!editing) return;
    if (isNew) await createMut.mutateAsync(editing);
    else await updateMut.mutateAsync(editing);
    setEditing(null);
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Memuat..." : `${services.length} layanan`}
        </p>
        <button
          onClick={openNew}
          className="accent-gradient accent-glow inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> Tambah Service
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((s) => (
            <div key={s.id} className="glass rounded-2xl p-4 flex items-start gap-4">
              {(() => {
                const isCustomImage = s.icon.startsWith("http://") || s.icon.startsWith("https://") || s.icon.includes("/") || s.icon.includes(".");
                if (isCustomImage) {
                  return (
                    <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-white/10 bg-transparent">
                      <img src={s.icon} alt="" className="h-full w-full object-contain" />
                    </div>
                  );
                }
                return (
                  <div
                    className="h-12 w-12 rounded-xl shrink-0 grid place-items-center text-white overflow-hidden p-1 bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})` }}
                  >
                    <Icon name={s.icon} className="h-6 w-6" />
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{s.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={"text-[10px] px-2 py-0.5 rounded-full border " + (s.active ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" : "bg-rose-500/15 text-rose-300 border-rose-400/30")}>
                    {s.active ? "Active" : "Inactive"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Order: {s.order}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => { setEditing({ ...s }); setIsNew(false); }} className="h-8 w-8 rounded-lg glass grid place-items-center hover:bg-white/10">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { if (confirm(`Hapus "${s.title}"?`)) deleteMut.mutate(s.id); }} className="h-8 w-8 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-400/30 grid place-items-center hover:bg-rose-500/25">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={isNew ? "Tambah Service" : "Edit Service"}>
          <div className="space-y-3">
            <Input label="Judul" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
            <Input label="Deskripsi" textarea value={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} />
            <div className="grid grid-cols-1 gap-3">
              <Input label="Link (opsional)" value={editing.url || ""} onChange={(v) => setEditing({ ...editing, url: v })} />
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Ikon</span>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nama Lucide (misal Sparkles) atau URL Gambar logo"
                    value={editing.icon}
                    onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                    className="input w-full"
                  />
                  <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl bg-white/5 border border-white/10">
                    {ICON_OPTIONS.map((i) => {
                      const isSelected = editing.icon === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEditing({ ...editing, icon: i })}
                          className={cn(
                            "h-7 px-2.5 rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer",
                            isSelected
                              ? "accent-gradient text-white shadow-md scale-105"
                              : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon name={i} className="h-3.5 w-3.5" />
                          {i}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput label="Gradient From" value={editing.gradientFrom} onChange={(v) => setEditing({ ...editing, gradientFrom: v })} />
              <ColorInput label="Gradient To" value={editing.gradientTo} onChange={(v) => setEditing({ ...editing, gradientTo: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Order" type="number" value={String(editing.order)} onChange={(v) => setEditing({ ...editing, order: Number(v) })} />
              <label className="flex items-center gap-2 mt-6">
                <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                <span className="text-sm">Aktif</span>
              </label>
            </div>
          </div>
          <ModalActions onCancel={() => setEditing(null)} onSave={save} saving={saving} />
        </Modal>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md p-3 md:p-6 overflow-y-auto animate-in fade-in" onClick={onClose}>
      <div className="glass-strong shimmer-border relative mx-auto max-w-lg rounded-2xl p-5 md:p-6 my-4 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-semibold">{title}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full grid place-items-center bg-white/10 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ModalActions({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving?: boolean }) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button onClick={onCancel} className="glass h-10 px-4 rounded-xl text-sm hover:bg-white/10">Batal</button>
      <button onClick={onSave} disabled={saving} className="accent-gradient accent-glow h-10 px-5 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2 disabled:opacity-50">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Simpan
      </button>
    </div>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  textarea,
  placeholder,
  ...props
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
  placeholder?: string;
  [key: string]: any;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          placeholder={placeholder}
          rows={3}
          className="input mt-1 resize-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      ) : (
        <input
          placeholder={placeholder}
          type={type}
          className="input mt-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
      )}
    </label>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-2 input">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-10 rounded cursor-pointer bg-transparent" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-transparent focus:outline-none text-sm" />
      </div>
    </label>
  );
}
