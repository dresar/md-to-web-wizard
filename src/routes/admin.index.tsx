import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, Sparkles, Share2, MessageSquare, ExternalLink, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProductsFn } from "@/lib/api/products";
import { getServicesFn } from "@/lib/api/services";
import { getSocialsFn } from "@/lib/api/socials";
import { getTemplatesFn } from "@/lib/api/templates";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => getProductsFn() });
  const { data: services = [] } = useQuery({ queryKey: ["services"], queryFn: () => getServicesFn() });
  const { data: socials = [] } = useQuery({ queryKey: ["socials"], queryFn: () => getSocialsFn() });
  const { data: templates = [] } = useQuery({ queryKey: ["templates"], queryFn: () => getTemplatesFn() });

  const stats = [
    { label: "Products", value: products.length, icon: Package, to: "/admin/products" },
    { label: "Services", value: services.length, icon: Sparkles, to: "/admin/services" },
    { label: "Social Links", value: socials.length, icon: Share2, to: "/admin/social" },
    { label: "WA Templates", value: templates.length, icon: MessageSquare, to: "/admin/templates" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="glass shimmer-border rounded-2xl p-6 md:p-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Welcome back</p>
        <h2 className="mt-1 font-display text-2xl md:text-3xl font-semibold">
          Kelola bio link kamu ✨
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg">
          Semua konten publik — profile, produk, layanan, dan template — bisa kamu update dari sini.
          Perubahan langsung tersimpan ke database dan terlihat di halaman utama.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/"
            className="accent-gradient accent-glow inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium text-white"
          >
            <Eye className="h-4 w-4" />
            Lihat halaman publik
          </Link>
          <Link
            to="/admin/products"
            className="glass inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm hover:bg-white/10"
          >
            Kelola Produk
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="glass rounded-2xl p-4 hover:bg-white/10 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="accent-gradient h-9 w-9 rounded-lg grid place-items-center text-white">
                <s.icon className="h-4 w-4" />
              </div>
              <span className="text-2xl font-display font-bold accent-text">{s.value}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground group-hover:text-foreground">
              {s.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-display font-semibold">Produk terakhir</h3>
        <div className="mt-4 divide-y divide-white/5">
          {products.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Belum ada produk.</p>
          )}
          {products.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-3">
              {p.mainImage ? (
                <img
                  src={p.mainImage}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover border border-white/10"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/10 grid place-items-center text-muted-foreground text-xs">
                  IMG
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
              </div>
              <span
                className={
                  "text-[10px] px-2 py-0.5 rounded-full border " +
                  (p.active
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                    : "bg-rose-500/15 text-rose-300 border-rose-400/30")
                }
              >
                {p.active ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
