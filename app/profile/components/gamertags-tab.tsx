"use client";
import {
  Add01Icon,
  Cancel01Icon,
  Delete02Icon,
  GameController02Icon,
  PencilEdit01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import type { ProfileFormData } from "../types";
import { PLATFORMS } from "../types";

interface GamertagsTabProps {
  formData: ProfileFormData;
  onAddGamertag: (platform: string, tag: string) => void;
  onRemoveGamertag: (platform: string) => void;
  onUpdateFormData: (updates: Partial<ProfileFormData>) => void;
}

export default function GamertagsTab({
  formData,
  onUpdateFormData,
  onAddGamertag,
  onRemoveGamertag,
}: GamertagsTabProps) {
  const [ui, setUi] = useState({
    newPlatform: PLATFORMS[0],
    newTag: "",
    editingPlatform: null as string | null,
    editValue: "",
    confirmDelete: null as string | null,
  });

  const availablePlatforms = PLATFORMS.filter(
    (p) => !formData.games.includes(p)
  );

  const handleAdd = () => {
    if (!ui.newTag.trim()) {
      return;
    }
    onAddGamertag(ui.newPlatform, ui.newTag.trim());
    setUi((prev) => ({ ...prev, newTag: "" }));
    if (availablePlatforms.length > 1) {
      const nextPlatform = availablePlatforms.find((p) => p !== ui.newPlatform);
      if (nextPlatform) {
        setUi((prev) => ({ ...prev, newPlatform: nextPlatform }));
      }
    }
  };

  const handleStartEdit = (platform: string) => {
    setUi((prev) => ({
      ...prev,
      editingPlatform: platform,
      editValue: formData.hiddenTags[platform] || "",
    }));
  };

  const handleSaveEdit = (platform: string) => {
    if (!ui.editValue.trim()) {
      return;
    }
    const newTags = { ...formData.hiddenTags, [platform]: ui.editValue.trim() };
    onUpdateFormData({ hiddenTags: newTags });
    setUi((prev) => ({ ...prev, editingPlatform: null }));
  };

  const handleCancelEdit = () => {
    setUi((prev) => ({ ...prev, editingPlatform: null, editValue: "" }));
  };

  const handleDelete = (platform: string) => {
    if (ui.confirmDelete === platform) {
      onRemoveGamertag(platform);
      setUi((prev) => ({ ...prev, confirmDelete: null }));
    } else {
      setUi((prev) => ({ ...prev, confirmDelete: platform }));
      setTimeout(() => {
        setUi((prev) => ({ ...prev, confirmDelete: null }));
      }, 3000);
    }
  };

  return (
    <div className="glass-panel space-y-6 rounded-2xl border border-white/5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-secondary/10 p-2 text-secondary">
          <HugeiconsIcon icon={GameController02Icon} size={24} />
        </div>
        <h2 className="font-bold text-fluid-lg text-white">Gamertags</h2>
        <span className="mr-auto text-fluid-xs text-gray-500">
          {formData.games.length} משחקים
        </span>
      </div>

      {/* Add New Gamertag */}
      {availablePlatforms.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/5 p-4">
          <h3 className="mb-3 font-bold text-fluid-sm text-white">
            הוסף משחק חדש
          </h3>
          <div className="space-y-2">
            <select
              className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-right text-fluid-sm text-white outline-hidden focus:border-primary/50"
              onChange={(e) =>
                setUi((prev) => ({ ...prev, newPlatform: e.target.value }))
              }
              value={ui.newPlatform}
            >
              {availablePlatforms.map((p) => (
                <option className="bg-card" key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                className="dir-ltr flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left font-mono text-fluid-sm text-white outline-hidden focus:border-primary/50"
                dir="ltr"
                onChange={(e) =>
                  setUi((prev) => ({ ...prev, newTag: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="הכנס את ה-Gamertag שלך..."
                type="text"
                value={ui.newTag}
              />
              <button
                className="rounded-xl bg-primary px-3 py-2.5 text-black transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!ui.newTag.trim()}
                onClick={handleAdd}
                type="button"
              >
                <HugeiconsIcon icon={Add01Icon} size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Gamertags */}
      <div className="space-y-2">
        {formData.games.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <HugeiconsIcon
              className="mx-auto mb-2 opacity-50"
              icon={GameController02Icon}
              size={32}
            />
            <p className="text-fluid-sm">עדיין לא הוספת משחקים</p>
            <p className="mt-1 text-fluid-xs text-gray-600">
              הוסף את ה-Gamertags שלך כדי שאחרים יוכלו למצוא אותך
            </p>
          </div>
        ) : (
          formData.games.map((platform) => (
            <div
              className="group space-y-2 rounded-xl border border-white/5 bg-black/20 p-3 transition-colors hover:border-white/10 sm:space-y-0"
              key={platform}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-right font-bold text-fluid-sm text-primary">
                  {platform}
                </span>
                {ui.editingPlatform !== platform && (
                  <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                      onClick={() => handleStartEdit(platform)}
                      title="ערוך"
                      type="button"
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                    </button>
                    <button
                      className={`rounded-lg p-1.5 transition-colors ${
                        ui.confirmDelete === platform
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          : "text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                      }`}
                      onClick={() => handleDelete(platform)}
                      title={
                        ui.confirmDelete === platform ? "לחץ שוב לאישור" : "מחק"
                      }
                      type="button"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
                    </button>
                  </div>
                )}
              </div>

              {ui.editingPlatform === platform ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="flex-1 rounded-lg border border-primary/30 bg-black/30 px-3 py-1 text-left font-mono text-fluid-sm text-white outline-hidden"
                    dir="ltr"
                    onChange={(e) =>
                      setUi((prev) => ({ ...prev, editValue: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveEdit(platform);
                      }
                      if (e.key === "Escape") {
                        handleCancelEdit();
                      }
                    }}
                    type="text"
                    value={ui.editValue}
                  />
                  <button
                    className="rounded-lg bg-green-500/20 px-2 py-1.5 text-green-400 transition-colors hover:bg-green-500/30"
                    onClick={() => handleSaveEdit(platform)}
                    type="button"
                  >
                    <HugeiconsIcon icon={Tick01Icon} size={14} />
                  </button>
                  <button
                    className="rounded-lg bg-red-500/20 px-2 py-1.5 text-red-400 transition-colors hover:bg-red-500/30"
                    onClick={handleCancelEdit}
                    type="button"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  </button>
                </div>
              ) : (
                <span
                  className="block w-full text-left font-mono text-fluid-sm text-white"
                  dir="ltr"
                >
                  {formData.hiddenTags[platform]}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {availablePlatforms.length === 0 && formData.games.length > 0 && (
        <p className="text-center text-fluid-xs text-gray-500">
          הוספת את כל המשחקים הזמינים 🎮
        </p>
      )}
    </div>
  );
}
