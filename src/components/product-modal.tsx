import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink, ZoomIn } from "lucide-react";
import type { Product } from "@/lib/store";
import { formatIDR } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ProductModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!product) return null;
  const images = [product.mainImage, ...product.gallery].filter(Boolean);
  const current = images[active] || product.mainImage;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="glass-strong shimmer-border relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 h-10 w-10 rounded-full grid place-items-center bg-black/60 hover:bg-black/80 text-white border border-white/15 backdrop-blur-md shadow-lg active:scale-95 transition-all duration-200"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex-1 overflow-y-auto p-5 md:p-7">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <button
                onClick={() => setLightbox(true)}
                className="relative group block w-full aspect-square overflow-hidden rounded-xl border border-white/10"
              >
                <img
                  src={current}
                  alt={product.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition grid place-items-center">
                  <ZoomIn className="h-8 w-8 text-white" />
                </div>
              </button>

              {images.length > 1 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={cn(
                        "aspect-square overflow-hidden rounded-lg border-2 transition",
                        i === active
                          ? "border-[var(--accent-1)] accent-glow"
                          : "border-white/10 hover:border-white/30",
                      )}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <h3 className="font-display text-2xl font-semibold">{product.title}</h3>
              <div className="mt-2 flex items-baseline gap-3">
                {product.price === 0 ? (
                  <span className="text-lg px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Gratis
                  </span>
                ) : product.discountPrice ? (
                  <>
                    <span className="text-2xl font-bold accent-text">
                      {formatIDR(product.discountPrice)}
                    </span>
                    <span className="line-through text-muted-foreground">
                      {formatIDR(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold accent-text">{formatIDR(product.price)}</span>
                )}
              </div>
              <p
                className={cn(
                  "mt-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line",
                  !expanded && "line-clamp-3 md:line-clamp-none"
                )}
              >
                {product.description}
              </p>
              {product.description && product.description.length > 120 && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="mt-2 text-xs font-semibold accent-text hover:underline text-left md:hidden cursor-pointer"
                >
                  {expanded ? "Sembunyikan" : "Baca Selengkapnya"}
                </button>
              )}

              <div className="mt-6 flex flex-row gap-3">
                <a
                  href={product.primaryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="accent-gradient accent-glow flex-1 h-14 shrink-0 rounded-2xl grid place-items-center font-bold text-sm sm:text-base tracking-wide text-white hover:brightness-110 active:scale-[0.98] transition-all shadow-lg"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {product.primaryLabel || "Beli Sekarang"}
                    <ExternalLink className="h-4.5 w-4.5" />
                  </span>
                </a>
                {product.secondaryUrl && (
                  <a
                    href={product.secondaryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="glass flex-1 h-14 shrink-0 rounded-2xl grid place-items-center font-bold text-sm sm:text-base tracking-wide hover:bg-white/10 active:scale-[0.98] transition-all shadow-md"
                  >
                    {product.secondaryLabel || "Lihat Demo"}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl grid place-items-center p-4 animate-in fade-in"
          onClick={() => setLightbox(false)}
        >
          <button
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 h-10 w-10 rounded-full grid place-items-center bg-white/10 hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => (a - 1 + images.length) % images.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full grid place-items-center bg-white/10 hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => (a + 1) % images.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full grid place-items-center bg-white/10 hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <img
            src={current}
            alt={product.title}
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
