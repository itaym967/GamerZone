"use client";

import { Refresh01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { domAnimation, LazyMotion, m } from "framer-motion";
import { useEffect, useState } from "react";
import OptimizedAvatar from "./optimized-avatar";

interface AvatarCreatorProps {
  initialSeed?: string;
  onSelect: (avatarUrl: string) => void;
}

type AvatarStyleId =
  | "adventurer"
  | "avataaars"
  | "big-smile"
  | "bottts"
  | "fun-emoji"
  | "lorelei"
  | "pixel-art"
  | "thumbs";

type AvatarMode = "generator" | "presets" | "url";

const AVATAR_STYLES = [
  { id: "avataaars", name: "אווטאר קלאסי", emoji: "😎" },
  { id: "bottts", name: "רובוט", emoji: "🤖" },
  { id: "pixel-art", name: "פיקסל ארט", emoji: "🎮" },
  { id: "lorelei", name: "אנימה", emoji: "✨" },
  { id: "adventurer", name: "הרפתקן", emoji: "🗡️" },
  { id: "big-smile", name: "חיוך גדול", emoji: "😄" },
  { id: "fun-emoji", name: "אימוג'י", emoji: "🎭" },
  { id: "thumbs", name: "אגודל", emoji: "👍" },
] as const satisfies ReadonlyArray<{
  emoji: string;
  id: AvatarStyleId;
  name: string;
}>;

const PRESET_AVATARS = [
  {
    id: "preset-neon-sniper",
    label: "Neon Sniper",
    url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=neon-sniper&backgroundColor=0f172a,1e293b,111827",
  },
  {
    id: "preset-cyber-samurai",
    label: "Cyber Samurai",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=cyber-samurai&backgroundColor=0b1020,111827,1f2937",
  },
  {
    id: "preset-space-raider",
    label: "Space Raider",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=space-raider&backgroundColor=0a0a0a,111827,1f2937",
  },
  {
    id: "preset-arcade-pro",
    label: "Arcade Pro",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=arcade-pro&backgroundColor=0b1020,111827",
  },
  {
    id: "preset-night-runner",
    label: "Night Runner",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=night-runner&backgroundColor=0b1020,1f2937",
  },
  {
    id: "preset-ranked-beast",
    label: "Ranked Beast",
    url: "https://api.dicebear.com/7.x/big-smile/svg?seed=ranked-beast&backgroundColor=0b1020,111827",
  },
] as const;

const MODE_BUTTONS = [
  { id: "generator", label: "בונה אווטאר" },
  { id: "presets", label: "מרקט אווטארים" },
  { id: "url", label: "ייבוא קישור" },
] as const satisfies ReadonlyArray<{ id: AvatarMode; label: string }>;

const HTTP_URL_REGEX = /^https?:\/\//i;

export default function AvatarCreator({
  onSelect,
  initialSeed = "",
}: AvatarCreatorProps) {
  const [selectedStyle, setSelectedStyle] =
    useState<AvatarStyleId>("avataaars");
  const [seed, setSeed] = useState(initialSeed || "gamer");
  const [mode, setMode] = useState<AvatarMode>("generator");
  const [selectedPresetUrl, setSelectedPresetUrl] = useState("");
  const [externalAvatarUrl, setExternalAvatarUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  const generatedAvatarUrl = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${encodeURIComponent(seed)}`;
  let effectiveAvatarUrl = generatedAvatarUrl;
  if (mode === "presets" && selectedPresetUrl) {
    effectiveAvatarUrl = selectedPresetUrl;
  } else if (mode === "url" && externalAvatarUrl) {
    effectiveAvatarUrl = externalAvatarUrl;
  }

  useEffect(() => {
    onSelect(effectiveAvatarUrl);
  }, [effectiveAvatarUrl, onSelect]);

  const randomize = () => {
    setMode("generator");
    setSeed(`gamer-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  };

  const selectPreset = (presetUrl: string) => {
    setSelectedPresetUrl(presetUrl);
    setMode("presets");
    setUrlError("");
  };

  const applyExternalAvatarUrl = () => {
    const trimmedUrl = externalAvatarUrl.trim();
    if (!trimmedUrl) {
      setUrlError("הכנס קישור לאווטאר");
      return;
    }
    if (!HTTP_URL_REGEX.test(trimmedUrl)) {
      setUrlError("הקישור חייב להתחיל ב-http:// או https://");
      return;
    }
    setMode("url");
    setExternalAvatarUrl(trimmedUrl);
    setUrlError("");
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-2">
          {MODE_BUTTONS.map((option) => (
            <button
              className={`rounded-lg border px-3 py-2 font-medium text-fluid-xs transition-colors ${
                mode === option.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-white/30"
              }`}
              key={option.id}
              onClick={() => setMode(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex justify-center">
          <m.div
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            key={effectiveAvatarUrl}
          >
            <div className="h-40 w-40 rounded-full bg-linear-to-br from-primary to-secondary p-1">
              <div className="h-full w-full overflow-hidden rounded-full bg-black">
                <OptimizedAvatar
                  alt="Avatar Preview"
                  className="h-full w-full object-cover"
                  seed={effectiveAvatarUrl}
                  size={160}
                />
              </div>
            </div>
            <button
              className="absolute -right-2 -bottom-2 rounded-full bg-primary p-3 text-black shadow-lg transition-all hover:scale-110 hover:bg-primary/80"
              onClick={randomize}
              title="אווטאר אקראי"
              type="button"
            >
              <HugeiconsIcon icon={Refresh01Icon} size={20} />
            </button>
          </m.div>
        </div>

        {mode === "generator" && (
          <div>
            <p className="mb-3 block text-right font-medium text-fluid-sm text-gray-400">
              בחר סגנון אווטאר
            </p>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_STYLES.map((style) => (
                <button
                  className={`relative rounded-xl border-2 p-3 text-center transition-all ${
                    selectedStyle === style.id
                      ? "border-primary bg-primary/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  type="button"
                >
                  <div className="mb-1 text-fluid-xl">{style.emoji}</div>
                  <div className="font-medium text-fluid-xs text-white">
                    {style.name}
                  </div>
                  {selectedStyle === style.id && (
                    <div className="absolute -top-1 -right-1 rounded-full bg-primary p-0.5 text-black">
                      <HugeiconsIcon icon={Tick01Icon} size={12} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "presets" && (
          <div className="space-y-3">
            <div className="text-right text-fluid-sm text-gray-300">
              בחר אווטאר מהמרקט
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_AVATARS.map((preset) => (
                <button
                  className={`rounded-xl border p-3 text-right transition-colors ${
                    selectedPresetUrl === preset.url
                      ? "border-primary bg-primary/10"
                      : "border-white/10 bg-white/5 hover:border-white/25"
                  }`}
                  key={preset.id}
                  onClick={() => selectPreset(preset.url)}
                  type="button"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-fluid-xs text-white">
                      {preset.label}
                    </span>
                    {selectedPresetUrl === preset.url && (
                      <HugeiconsIcon
                        className="text-primary"
                        icon={Tick01Icon}
                        size={14}
                      />
                    )}
                  </div>
                  <div className="mx-auto h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-black">
                    <OptimizedAvatar
                      alt={preset.label}
                      className="h-full w-full"
                      seed={preset.url}
                      size={64}
                    />
                  </div>
                </button>
              ))}
            </div>
            <a
              className="inline-flex items-center rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-primary text-xs transition-colors hover:bg-primary/20"
              href="https://readyplayer.me/"
              rel="noopener"
              target="_blank"
            >
              Ready Player Me (3D) - open builder
            </a>
          </div>
        )}

        {mode === "url" && (
          <div className="space-y-3">
            <div className="text-right text-fluid-sm text-gray-300">
              הדבק קישור לאווטאר
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg bg-primary px-3 py-2 font-medium text-black text-xs transition-colors hover:bg-primary/90"
                onClick={applyExternalAvatarUrl}
                type="button"
              >
                החל
              </button>
              <input
                className="h-10 flex-1 rounded-lg border border-white/10 bg-black/25 px-3 text-right text-fluid-sm text-white outline-hidden focus:border-primary/50"
                onChange={(event) => {
                  setExternalAvatarUrl(event.target.value);
                  setUrlError("");
                }}
                placeholder="https://..."
                type="url"
                value={externalAvatarUrl}
              />
            </div>
            {urlError && (
              <div className="text-right text-red-400 text-xs">{urlError}</div>
            )}
          </div>
        )}

        {/* Randomize Button */}
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-white transition-all hover:border-primary/50"
          onClick={randomize}
          type="button"
        >
          <HugeiconsIcon icon={Refresh01Icon} size={18} />
          <span>אווטאר אקראי חדש</span>
        </button>
      </div>
    </LazyMotion>
  );
}
