import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTemplatesFn,
  createTemplateAction,
  updateTemplateAction,
  deleteTemplateAction,
} from "@/lib/api/templates";
import { newId, type WhatsAppTemplate } from "@/lib/store";
import { Modal, ModalActions, Input } from "./admin.services";

export const Route = createFileRoute("/admin/templates")({
  component: TemplatesAdmin,
});

function TemplatesAdmin() {
  const qc = useQueryClient();
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => getTemplatesFn(),
  });

  const createMut = useMutation({
    mutationFn: (t: WhatsAppTemplate) => createTemplateAction({ data: t }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
  const updateMut = useMutation({
    mutationFn: (t: Partial<WhatsAppTemplate> & { id: string }) => updateTemplateAction({ data: t }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTemplateAction({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });

  const [editing, setEditing] = useState<WhatsAppTemplate | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => {
    setEditing({ id: newId(), category: "Greeting", title: "", message: "" });
    setIsNew(true);
  };

  const save = async () => {
    if (!editing) return;
    if (isNew) await createMut.mutateAsync(editing);
    else await updateMut.mutateAsync(editing);
    setEditing(null);
  };

  const saving = createMut.isPending || updateMut.isPending;

  const grouped = templates.reduce<Record<string, WhatsAppTemplate[]>>((acc, t) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Memuat..." : `${templates.length} template`}
        </p>
        <button
          onClick={openNew}
          className="accent-gradient accent-glow inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> Tambah Template
        </button>
      </div>

      {templates.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground py-8 text-center">Belum ada template.</p>
      )}

      <div className="space-y-5">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{cat}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((t) => (
                <div key={t.id} className="glass rounded-2xl p-4">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-medium text-sm">{t.title}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditing({ ...t }); setIsNew(false); }}
                        className="h-8 w-8 rounded-lg glass grid place-items-center hover:bg-white/10"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Hapus template ini?")) deleteMut.mutate(t.id); }}
                        className="h-8 w-8 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-400/30 grid place-items-center hover:bg-rose-500/25"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{t.message}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={isNew ? "Tambah Template" : "Edit Template"}>
          <div className="space-y-3">
            <Input label="Kategori" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} />
            <Input label="Judul" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
            <Input label="Pesan" textarea value={editing.message} onChange={(v) => setEditing({ ...editing, message: v })} />
          </div>
          <ModalActions onCancel={() => setEditing(null)} onSave={save} saving={saving} />
        </Modal>
      )}
    </div>
  );
}
