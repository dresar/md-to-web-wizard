import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { accentPresets, useBioStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function AccentSwitcher() {
  const [open, setOpen] = useState(false);
  const accent = useBioStore((s) => s.settings.accent);
  const setAccent = useBioStore((s) => s.setAccent);

  return (
    <div className="fixed left-4 bottom-4 z-40 flex flex-col items-start gap-2">
      {open && (
        <div className="glass accent-glow rounded-2xl p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-xs text-muted-foreground px-1 pb-1">Tema Aksen</p>
          <div className="grid grid-cols-3 gap-2">
            {accentPresets.map((p) => (
              <button
                key={p.name}
                onClick={() => setAccent(p.name)}
                className={cn(
                  "h-9 w-9 rounded-full border border-white/15 transition-transform hover:scale-110 relative",
                  accent === p.name && "ring-2 ring-white/70",
                )}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                  boxShadow: `0 6px 18px -6px ${p.from}`,
                }}
                aria-label={p.label}
                title={p.label}
              >
                {accent === p.name && (
                  <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass accent-glow h-12 w-12 rounded-full grid place-items-center hover:scale-105 transition-transform"
        aria-label="Ubah tema warna"
      >
        <Palette className="h-5 w-5 text-foreground" />
      </button>
    </div>
  );
}
