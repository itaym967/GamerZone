import { Zap } from "lucide-react";

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
        <div dir="ltr" className={`flex items-center font-black tracking-tighter select-none group ${text} ${className}`}>
            <span className="text-white relative">
                Gamer
                <span className="absolute inset-0 text-white/50 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">Gamer</span>
            </span>

            <div className="flex items-center text-primary relative">
                {/* The 'Z' represented by a lightning bolt */}
                <div className="relative mx-[1px] flex items-center justify-center transform translate-y-[2px]">
                    <Zap
                        size={icon * 1.1}
                        className="fill-current transform transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(0,255,157,0.8)]"
                        strokeWidth={3}
                        style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.5))" }}
                    />
                    <div className="absolute inset-0 bg-primary/20 blur-md rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* The rest of 'Zone' */}
                <span className="relative">
                    one
                    <span className="absolute inset-0 text-primary/50 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">one</span>
                </span>
            </div>
        </div>
    );
}
