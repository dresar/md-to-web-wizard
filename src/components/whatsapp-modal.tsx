import { useMemo, useState } from "react";
import { X, Send, RotateCcw, MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProfileFn } from "@/lib/api/profile";
import { getTemplatesFn } from "@/lib/api/templates";
import { cn } from "@/lib/utils";

export function WhatsAppModal({ onClose }: { onClose: () => void }) {
  const { data: profile, isLoading: profileLoading } = useQuery({ 
    queryKey: ["profile"], 
    queryFn: () => getProfileFn() 
  });
  const { data: templates = [], isLoading: templatesLoading } = useQuery({ 
    queryKey: ["templates"], 
    queryFn: () => getTemplatesFn() 
  });
  
  const [tab, setTab] = useState<"template" | "custom">("template");
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(templates.map((t) => t.category))),
    [templates],
  );

  const message =
    tab === "template"
      ? templates.find((t) => t.id === selected)?.message || ""
      : custom;

  const sendUrl = `https://wa.me/${profile?.whatsappNumber || ""}?text=${encodeURIComponent(
    message || "Halo!",
  )}`;

  if (profileLoading || templatesLoading) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
        <div className="glass-strong p-6 rounded-2xl flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-2" />
          <p className="text-xs text-muted-foreground">Menghubungkan ke WhatsApp...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="glass-strong shimmer-border w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-5 md:p-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="accent-gradient accent-glow h-10 w-10 rounded-xl grid place-items-center shrink-0">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Chat via WhatsApp</h3>
              <p className="text-xs text-muted-foreground">
                Kirim pesan langsung ke {profile.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full grid place-items-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/90 hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
          {(["template", "custom"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "h-9 rounded-lg text-sm font-medium transition",
                tab === t
                  ? "accent-gradient text-white shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "template" ? "Template" : "Pesan Custom"}
            </button>
          ))}
        </div>

        {tab === "template" ? (
          <div className="mt-4 space-y-4 max-h-[40vh] overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div key={cat}>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" /> {cat}
                </p>
                <div className="grid gap-2">
                  {templates
                    .filter((t) => t.category === cat)
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelected(t.id)}
                        className={cn(
                          "text-left rounded-xl p-3 border transition",
                          selected === t.id
                            ? "border-[var(--accent-1)] bg-white/10 accent-glow"
                            : "border-white/10 bg-white/5 hover:bg-white/10",
                        )}
                      >
                        <div className="text-sm font-medium">{t.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {t.message}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            rows={5}
            placeholder="Tulis pesanmu di sini..."
            className="mt-4 w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm focus:outline-none focus:border-[var(--accent-1)]"
          />
        )}

        <div className="mt-4 shrink-0">
          <p className="text-xs text-muted-foreground mb-1">Preview pesan:</p>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-3 text-sm min-h-14">
            {message || <span className="text-muted-foreground">Belum ada pesan…</span>}
          </div>
        </div>

        <div className="mt-5 flex gap-3 shrink-0">
          <button
            onClick={() => {
              setSelected(null);
              setCustom("");
            }}
            className="h-12 px-5 rounded-xl glass hover:bg-white/10 active:scale-[0.98] inline-flex items-center justify-center gap-2 text-sm font-semibold transition-all"
          >
            <RotateCcw className="h-4 w-4" /> Clear
          </button>
          <a
            href={sendUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex-1 h-12 rounded-xl grid place-items-center font-bold text-sm tracking-wide text-white active:scale-[0.98] transition-all",
              message
                ? "accent-gradient accent-glow hover:brightness-110"
                : "bg-white/10 pointer-events-none opacity-50",
            )}
          >
            <span className="inline-flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send WhatsApp
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
