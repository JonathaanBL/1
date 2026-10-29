// Adapted from 21st.dev "Profile Card" by ravikatiyar162
// (https://21st.dev/ravikatiyar162/profile-card-1).
import { ArrowUpRight } from "lucide-react";
import { useState, type ComponentType } from "react";

export interface SocialLink {
  id: string;
  /** Accessible name, also shown as the tooltip. */
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Opens this URL in a new tab. Leave it out to render a button that runs `onClick`. */
  href?: string;
  onClick?: () => void;
}

export interface ProfileCardProps {
  avatarUrl: string;
  name: string;
  title: string;
  bio: string;
  socialLinks?: SocialLink[];
  actionButton: { text: string; href: string };
}

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export function ProfileCard({
  avatarUrl,
  name,
  title,
  bio,
  socialLinks = [],
  actionButton,
}: ProfileCardProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative flex flex-col items-center rounded-3xl border border-white/10 bg-card/45 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <Avatar url={avatarUrl} name={name} />

        <h1 className="text-2xl font-bold text-card-foreground">{name}</h1>
        <p className="mt-1 text-sm font-semibold text-accent">{title}</p>
        <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">{bio}</p>

        <div className="my-6 h-px w-1/2 rounded-full bg-border" />

        <ul className="flex items-center justify-center gap-3">
          {socialLinks.map((item) => (
            <li key={item.id}>
              <SocialButton item={item} hoveredItem={hoveredItem} setHoveredItem={setHoveredItem} />
            </li>
          ))}
        </ul>

        <a
          href={actionButton.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`group mt-8 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-[background-color,scale] duration-200 ease-out hover:bg-primary/85 motion-safe:active:scale-95 ${FOCUS_RING}`}
        >
          <span>{actionButton.text}</span>
          <ArrowUpRight
            size={16}
            aria-hidden="true"
            className="transition-transform duration-300 ease-out motion-safe:group-hover:rotate-45"
          />
        </a>
      </div>

      <div className="absolute inset-0 -z-10 rounded-3xl bg-linear-to-r from-primary/50 to-sunset/50 opacity-40 blur-2xl" />
    </div>
  );
}

function Avatar({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="mb-4 size-28 rounded-full bg-linear-to-tr from-tiktok-cyan via-primary to-sunset p-[3px]">
      <div className="size-full rounded-full bg-background p-1">
        {failed ? (
          <div
            role="img"
            aria-label={name}
            className="flex size-full items-center justify-center rounded-full bg-secondary text-3xl font-bold text-secondary-foreground"
          >
            {name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <img
            src={url}
            alt={name}
            width={104}
            height={104}
            className="size-full rounded-full object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  );
}

interface SocialButtonProps {
  item: SocialLink;
  hoveredItem: string | null;
  setHoveredItem: (id: string | null) => void;
}

function SocialButton({ item, hoveredItem, setHoveredItem }: SocialButtonProps) {
  const className = `group relative flex size-12 items-center justify-center overflow-hidden rounded-full bg-secondary/60 transition-colors duration-300 ease-out hover:bg-secondary ${FOCUS_RING}`;
  const handlers = {
    onMouseEnter: () => setHoveredItem(item.id),
    onMouseLeave: () => setHoveredItem(null),
    onFocus: () => setHoveredItem(item.id),
    onBlur: () => setHoveredItem(null),
  };
  const icon = (
    <item.icon
      size={20}
      className="text-secondary-foreground/75 transition-colors duration-200 ease-out group-hover:text-secondary-foreground"
    />
  );

  return (
    <div className="relative">
      {item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className={className}
          {...handlers}
        >
          {icon}
        </a>
      ) : (
        <button type="button" aria-label={item.label} onClick={item.onClick} className={className} {...handlers}>
          {icon}
        </button>
      )}
      <Tooltip label={item.label} visible={hoveredItem === item.id} />
    </div>
  );
}

function Tooltip({ label, visible }: { label: string; visible: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -top-12 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-[opacity,translate] duration-300 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
    >
      {label}
      <div className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-r border-b border-border bg-popover" />
    </div>
  );
}
