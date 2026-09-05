import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  ChevronRight,
  Instagram,
  Music2,
  Github,
  Youtube,
  MessageCircle,
  Coffee,
  Globe,
  Palette,
  Bot,
  MessagesSquare,
  Twitter,
  Linkedin,
  Facebook,
  Twitch,
  Send,
  Eye,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getProfileFn } from "@/lib/api/profile";
import { getProductsFn } from "@/lib/api/products";
import { getServicesFn } from "@/lib/api/services";
import { getSocialsFn } from "@/lib/api/socials";
import { useBioStore, formatIDR, type Product } from "@/lib/store";
import { ParticlesBg } from "@/components/particles-bg";
import { AccentSwitcher } from "@/components/accent-switcher";
import { FloatingButtons } from "@/components/floating-buttons";
import { SiteFooter } from "@/components/site-footer";
import { ProductModal } from "@/components/product-modal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

const ICONS: Record<string, LucideIcon> = {
  Instagram,
  Music2,
  Github,
  Youtube,
  MessageCircle,
  Coffee,
  Twitter,
  Linkedin,
  Facebook,
  Twitch,
  Send,
  Globe,
  Palette,
  Bot,
  MessagesSquare,
};

function Icon({ name, className }: { name: string; className?: string }) {
  const isImageUrl = name.startsWith("http://") || name.startsWith("https://") || name.includes("/") || name.includes(".");
  if (isImageUrl) {
    return <img src={name} alt="" className={cn(className, "object-contain rounded-sm")} />;
  }
  const C = ICONS[name] || Globe;
  return <C className={className} />;
}

function Home() {
  const { data: profile, isLoading: isProfileLoading } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const { data: socials = [], isLoading: isSocialsLoading } = useQuery({ queryKey: ["socials"], queryFn: () => getSocialsFn() });
  const { data: services = [], isLoading: isServicesLoading } = useQuery({ queryKey: ["services"], queryFn: () => getServicesFn() });
  const { data: products = [], isLoading: isProductsLoading } = useQuery({ queryKey: ["products"], queryFn: () => getProductsFn() });

  const [selected, setSelected] = useState<Product | null>(null);
  const [showAvatarLightbox, setShowAvatarLightbox] = useState(false);

  const isLoading = isProfileLoading || isSocialsLoading || isServicesLoading || isProductsLoading;

  if (isLoading) {
    return (
      <div className="bg-app min-h-screen grid place-items-center relative overflow-hidden">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative">
            <div className="accent-gradient absolute inset-0 rounded-full blur-xl opacity-70 animate-pulse" />
            <div className="relative h-14 w-14 rounded-full border-4 border-white/5 border-t-[var(--accent-1)] animate-spin" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app min-h-screen relative overflow-x-hidden">
      <ParticlesBg />

      <main className="mx-auto max-w-2xl px-4 pt-6 md:pt-14 pb-6">
        {/* Profile */}
        {profile && (
          <section className="flex flex-col items-center text-center">
            <button
              onClick={() => setShowAvatarLightbox(true)}
              className="relative group cursor-zoom-in active:scale-98 transition-transform"
              aria-label="Lihat foto profil"
            >
              <div className="accent-gradient absolute -inset-1 rounded-2xl blur-lg opacity-85 group-hover:opacity-100 transition-opacity animate-pulse" />
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="relative h-24 w-24 rounded-2xl object-cover border-2 border-white/20 shadow-2xl"
              />
            </button>
            <h1 className="mt-4 text-2xl md:text-3xl font-display font-bold inline-flex items-center gap-2 justify-center tracking-tight">
              {profile.name}
              {profile.verified && (
                <BadgeCheck className="h-5 w-5 md:h-6 md:w-6 text-blue-400 fill-blue-500" />
              )}
            </h1>
            <p className="text-xs md:text-sm font-semibold tracking-wider uppercase mt-1 accent-text opacity-95">{profile.title}</p>
            <p className="mt-2.5 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {profile.description}
            </p>
          </section>
        )}

        {/* Socials */}
        {socials.length > 0 && (
          <section className="mt-8 flex flex-wrap gap-3 justify-center">
            {socials
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="glass h-11 w-11 rounded-full grid place-items-center hover:-translate-y-1.5 hover:rotate-3 transition-transform"
                  style={{ boxShadow: "0 8px 20px -10px var(--accent-glow)" }}
                >
                  <Icon name={s.icon} className="h-5 w-5" />
                </a>
              ))}
          </section>
        )}

        {/* Services */}
        {services.filter((s) => s.active).length > 0 && (
          <section className="mt-10">
            <SectionTitle>Services</SectionTitle>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {services
                .filter((s) => s.active)
                .sort((a, b) => a.order - b.order)
                .map((s) => (
                  <a
                    key={s.id}
                    href={s.url || "#"}
                    target={s.url ? "_blank" : undefined}
                    rel="noreferrer"
                    className="group glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition"
                  >
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
                          className="h-12 w-12 rounded-xl grid place-items-center text-white shrink-0"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})`,
                            boxShadow: `0 8px 20px -8px ${s.gradientFrom}`,
                          }}
                        >
                          <Icon name={s.icon} className="h-5 w-5" />
                        </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[var(--accent-1)] group-hover:translate-x-1 transition" />
                  </a>
                ))}
            </div>
          </section>
        )}

        {/* Products */}
        {products.filter((p) => p.active).length > 0 && (
          <section className="mt-10">
            <SectionTitle>Portfolio &amp; Products</SectionTitle>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {products
                .filter((p) => p.active)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className="group glass rounded-2xl overflow-hidden text-left flex flex-col hover:bg-white/10 transition"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      {p.mainImage ? (
                        <img
                          src={p.mainImage}
                          alt={p.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-white/5 grid place-items-center text-muted-foreground text-xs">
                          No Image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition grid place-items-center">
                        <div className="glass h-10 w-10 rounded-full grid place-items-center">
                          <Eye className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>
                      <div className="mt-2">
                        {p.price === 0 ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            Gratis
                          </span>
                        ) : p.discountPrice ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold accent-text">{formatIDR(p.discountPrice)}</span>
                            <span className="text-[10px] line-through text-muted-foreground">{formatIDR(p.price)}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold accent-text">{formatIDR(p.price)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </section>
        )}

        <SiteFooter />
      </main>

      <FloatingButtons />
      <AccentSwitcher />

      <ProductModal product={selected} onClose={() => setSelected(null)} />

      {showAvatarLightbox && profile && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl grid place-items-center p-4 animate-in fade-in cursor-zoom-out"
          onClick={() => setShowAvatarLightbox(false)}
        >
          <button
            onClick={() => setShowAvatarLightbox(false)}
            className="absolute right-4 top-4 h-10 w-10 rounded-full grid place-items-center bg-white/10 hover:bg-white/20 text-white z-50 active:scale-95 transition-all"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("h-px flex-1", "bg-gradient-to-r from-transparent to-white/20")} />
      <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{children}</h2>
      <span className={cn("h-px flex-1", "bg-gradient-to-l from-transparent to-white/20")} />
    </div>
  );
}
