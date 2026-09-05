import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeManager } from "@/components/theme-manager";

function NotFoundComponent() {
  return (
    <div className="bg-app flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-7xl font-bold accent-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang kamu cari tidak tersedia atau telah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="accent-gradient inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white hover:brightness-110 transition"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="bg-app flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-xl font-semibold">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ada masalah saat memuat halaman ini. Coba refresh atau kembali ke beranda.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="accent-gradient inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white"
          >
            Coba lagi
          </button>
          <a
            href="/"
            className="glass inline-flex items-center justify-center rounded-md px-4 py-2 text-sm"
          >
            Ke beranda
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Eka Syarif Maulana — Bio Link" },
      {
        name: "description",
        content:
          "Full‑stack developer & digital creator. Jasa website, UI/UX, dan produk digital. Terhubung lewat satu link.",
      },
      { name: "author", content: "Eka Syarif Maulana" },
      { property: "og:title", content: "Eka Syarif Maulana — Bio Link" },
      {
        property: "og:description",
        content:
          "Full‑stack developer & digital creator. Jasa website, UI/UX, dan produk digital.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#2563eb" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/logo.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/logo.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("Service Worker registered scope:", reg.scope))
          .catch((err) => console.error("Service Worker registration failed:", err));
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeManager />
      <Outlet />
    </QueryClientProvider>
  );
}
