import { Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { TikTokIcon } from "./components/icons/tiktok-icon";
import AnimatedGradientBackground from "./components/ui/animated-gradient-background";
import { ProfileCard } from "./components/ui/profile-card";
import { profile } from "./profile";

// Night-to-sunset palette taken from the avatar, with TikTok's pink and cyan at the edges.
const GRADIENT_COLORS = ["#0B0A12", "#3B1C6E", "#9D2BB5", "#FE2C55", "#FF8A3D", "#FFC857", "#25F4EE"];
const GRADIENT_STOPS = [35, 50, 60, 70, 80, 90, 100];

export default function App() {
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    if (!shareStatus) return;
    const timer = setTimeout(() => setShareStatus(""), 2500);
    return () => clearTimeout(timer);
  }, [shareStatus]);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("¡Enlace copiado!");
    } catch {
      setShareStatus("No se pudo copiar el enlace");
    }
  }

  return (
    <div className="relative min-h-dvh">
      <div className="fixed inset-0 overflow-hidden" aria-hidden="true">
        <AnimatedGradientBackground breathing gradientColors={GRADIENT_COLORS} gradientStops={GRADIENT_STOPS} />
      </div>

      <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-16">
        <ProfileCard
          avatarUrl={profile.avatarUrl}
          name={profile.name}
          title={`@${profile.username}`}
          bio={profile.bio}
          socialLinks={[
            { id: "tiktok", label: "TikTok", icon: TikTokIcon, href: profile.tiktokUrl },
            { id: "share", label: "Compartir", icon: Share2, onClick: share },
          ]}
          actionButton={{ text: "Sígueme en TikTok", href: profile.tiktokUrl }}
        />
        <p role="status" className="min-h-5 text-sm font-medium text-foreground">
          {shareStatus}
        </p>
      </main>
    </div>
  );
}
