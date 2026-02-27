import { ZapIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeConfig = {
    sm: { text: "text-lg", icon: 18 },
    md: { text: "text-2xl", icon: 24 },
    lg: { text: "text-4xl", icon: 40 },
    xl: { text: "text-6xl", icon: 64 },
  };

  const { text, icon } = sizeConfig[size];

  return (
    <div
      className={`group flex select-none items-center font-black tracking-tighter ${text} ${className}`}
      dir="ltr"
    >
      <span className="relative text-white">
        Gamer
        <span className="absolute inset-0 text-white/50 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100">
          Gamer
        </span>
      </span>

      <div className="relative flex items-center text-primary">
        {/* The 'Z' represented by a lightning bolt */}
        <div className="relative mx-[1px] flex translate-y-[2px] transform items-center justify-center">
          <HugeiconsIcon
            className="transform fill-current transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(0,255,157,0.8)]"
            icon={ZapIcon}
            size={icon * 1.1}
            style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.5))" }}
          />
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
        </div>

        {/* The rest of 'Zone' */}
        <span className="relative">
          one
          <span className="absolute inset-0 text-primary/50 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100">
            one
          </span>
        </span>
      </div>
    </div>
  );
}
