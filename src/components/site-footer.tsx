import { useQuery } from "@tanstack/react-query";
import { getProfileFn } from "@/lib/api/profile";
import { getSocialsFn } from "@/lib/api/socials";
import {
  Heart,
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
  type LucideIcon,
} from "lucide-react";

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
  const C = ICONS[name] || Globe;
  return <C className={className} />;
}

export function SiteFooter() {
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const { data: socials = [] } = useQuery({ queryKey: ["socials"], queryFn: () => getSocialsFn() });

  return (
    <footer className="relative mt-16 pb-10">
      <div className="glass-strong shimmer-border relative rounded-3xl overflow-hidden w-full mx-auto flex flex-col">
        {/* Top Section: Socials, User Handle, Copyright */}
        <div className="flex flex-col items-center pt-10 pb-8 px-6 text-center">
          {/* Socials Icons List */}
          {socials.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 max-w-[280px] md:max-w-md mx-auto mb-6">
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
                    className="glass h-11 w-11 rounded-full grid place-items-center hover:-translate-y-1 hover:scale-105 transition-all duration-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]"
                  >
                    <Icon name={s.icon} className="h-5 w-5 text-white/95" />
                  </a>
                ))}
            </div>
          )}

          {/* User Handle */}
          <p className="font-display font-bold text-xl md:text-2xl tracking-wide accent-text mt-2 drop-shadow-[0_0_12px_var(--accent-glow)] select-none">
            @{profile?.slug || "BioLinkEka"}
          </p>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground mt-3 font-medium tracking-wide">
            © {new Date().getFullYear()} {profile?.name || "Eka Syarif Maulana"}. All rights reserved.
          </p>
        </div>

        {/* Shimmering / Glowing Divider Line */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-2)] to-transparent blur-[1px]" />
        </div>

        {/* Bottom Section: Made with ❤️ */}
        <div className="flex flex-col items-center py-8 px-6 text-center bg-black/15">
          <p className="text-xs tracking-wider text-muted-foreground uppercase font-semibold">Made with</p>
          <Heart className="heartbeat h-6 w-6 text-rose-500 fill-rose-500 my-2 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
          <p className="text-sm font-semibold text-foreground/90 tracking-wide">
            {profile?.name || "Eka Syarif Maulana"}
          </p>
        </div>
      </div>
    </footer>
  );
}

