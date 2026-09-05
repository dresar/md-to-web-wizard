import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccentName = "purple" | "blue" | "emerald" | "orange" | "red" | "pink";

export interface Profile {
  name: string;
  title: string;
  description: string;
  avatarUrl: string;
  verified: boolean;
  whatsappNumber: string; // digits only, e.g. 6282392115909
  slug: string;
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
  icon: string; // lucide name
  order: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  url?: string;
  gradientFrom: string;
  gradientTo: string;
  order: number;
  active: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number; // 0 = Gratis
  discountPrice?: number;
  primaryUrl: string;
  primaryLabel: string;
  secondaryUrl?: string;
  secondaryLabel?: string;
  mainImage: string;
  gallery: string[];
  active: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  category: string;
  title: string;
  message: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  accent: AccentName;
  theme: "dark" | "light";
  imagekitPublicKey?: string;
  imagekitPrivateKey?: string;
  imagekitUrlEndpoint?: string;
}

// ─── UI-only Store (no persistence, no dummy data) ───────────────────────────

interface UiStore {
  settings: Pick<SiteSettings, "accent" | "theme">;
  setAccent: (a: AccentName) => void;
  setTheme: (t: "dark" | "light") => void;
}

export const useBioStore = create<UiStore>((set) => ({
  settings: {
    accent: "blue",
    theme: "dark",
  },
  setAccent: (a) => set((s) => ({ settings: { ...s.settings, accent: a } })),
  setTheme: (t) => set((s) => ({ settings: { ...s.settings, theme: t } })),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const newId = () => Math.random().toString(36).slice(2, 10);

export const accentPresets: { name: AccentName; label: string; from: string; to: string }[] = [
  { name: "purple", label: "Neon Purple", from: "#7c3aed", to: "#c084fc" },
  { name: "blue", label: "Ocean Blue", from: "#2563eb", to: "#60a5fa" },
  { name: "emerald", label: "Emerald Green", from: "#10b981", to: "#6ee7b7" },
  { name: "orange", label: "Amber Orange", from: "#f59e0b", to: "#fbbf24" },
  { name: "red", label: "Ruby Red", from: "#ef4444", to: "#fb7185" },
  { name: "pink", label: "Sunset Pink", from: "#ec4899", to: "#f9a8d4" },
];

export function formatIDR(v: number): string {
  if (!v) return "Gratis";
  return "Rp " + v.toLocaleString("id-ID");
}
