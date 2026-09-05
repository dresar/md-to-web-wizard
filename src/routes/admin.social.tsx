import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSocialsFn,
  createSocialAction,
  updateSocialAction,
  deleteSocialAction,
} from "@/lib/api/socials";
import { newId, type SocialLink } from "@/lib/store";
import { Modal, ModalActions, Input } from "./admin.services";

export const Route = createFileRoute("/admin/social")({
  component: SocialAdmin,
});

const ICON_OPTIONS = [
  "Instagram", "Music2", "Github", "Youtube", "MessageCircle",
  "Coffee", "Twitter", "Linkedin", "Facebook", "Twitch", "Send", "Globe",
];

function SocialAdmin() {
  const qc = useQueryClient();
  const { data: socials = [], isLoading } = useQuery({
    queryKey: ["socials"],
    queryFn: () => getSocialsFn(),
  });

  const createMut = useMutation({
    mutationFn: (s: SocialLink) => createSocialAction({ data: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["socials"] }),
  });
  const updateMut = useMutation({
    mutationFn: (s: Partial<SocialLink> & { id: string }) => updateSocialAction({ data: s }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["socials"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSocialAction({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["socials"] }),
  });

  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => {
    setEditing({ id: newId(), label: "", url: "", icon: "Globe", order: socials.length + 1 });
    setIsNew(true);
  };

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
          {isLoading ? "Memuat..." : `${socials.length} social link`}
        </p>
        <button
          onClick={openNew}
          className="accent-gradient accent-glow inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> Tambah Link
        </button>
      </div>

      <div className="glass rounded-2xl divide-y divide-white/5">
        {socials.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground py-8 text-center">Belum ada social link.</p>
        )}
        {socials
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3">
              <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 grid place-items-center text-xs font-mono">
                {s.icon.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground truncate">{s.url}</p>
              </div>
              <button
                onClick={() => { setEditing({ ...s }); setIsNew(false); }}
                className="h-8 w-8 rounded-lg glass grid place-items-center hover:bg-white/10"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => { if (confirm(`Hapus "${s.label}"?`)) deleteMut.mutate(s.id); }}
                className="h-8 w-8 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-400/30 grid place-items-center hover:bg-rose-500/25"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={isNew ? "Tambah Social" : "Edit Social"}>
          <div className="space-y-3">
            <Input label="Nama" value={editing.label} onChange={(v) => setEditing({ ...editing, label: v })} />
            <Input label="URL" value={editing.url} onChange={(v) => setEditing({ ...editing, url: v })} />
            <label className="block">
              <span className="text-xs text-muted-foreground">Ikon</span>
              <select className="input mt-1" value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })}>
                {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>
            <Input label="Order" type="number" value={String(editing.order)} onChange={(v) => setEditing({ ...editing, order: Number(v) })} />
          </div>
          <ModalActions onCancel={() => setEditing(null)} onSave={save} saving={saving} />
        </Modal>
      )}
    </div>
  );
}
